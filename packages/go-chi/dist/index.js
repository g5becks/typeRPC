"use strict";
/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_utils_1 = require("@typerpc/plugin-utils");
const go_plugin_utils_1 = require("@typerpc/go-plugin-utils");
const invokeMethod = (svcName, method) => {
    return `
    ${go_plugin_utils_1.buildResultDeclarations(method.returnType)}
    func() {
    defer handlePanic(w, ${method.hasCborReturn ? 'true' : 'false'})
    ${go_plugin_utils_1.buildResultInitializers(method.returnType)} = ${plugin_utils_1.lowerCase(svcName)}.${plugin_utils_1.capitalize(method.name)}(ctx${method.hasParams ? ', ' : ''} ${go_plugin_utils_1.buildParamNames(method)})
    }()`;
};
const sendResponse = (method) => {
    return `
  if err != nil {
		RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})

		return
	}
	 ${go_plugin_utils_1.buildServerResponseStruct(method.returnType)}
   respData, err := marshalResponse(response, ${method.hasCborReturn ? 'true' : 'false'})
   if err != nil {
    		RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})

		    return
   }
   w.Header().Set("Content-Type", "application/${method.hasCborReturn ? 'cbor' : 'json'}")
   w.WriteHeader(${method.responseCode})
   _, _ = w.Write(respData)`;
};
const buildHandler = (svcName, method) => {
    return `
   rtr.${plugin_utils_1.capitalize(method.httpMethod.toLowerCase())}("/${plugin_utils_1.lowerCase(method.name)}", func(w http.ResponseWriter, r *http.Request) {
    var err error
    ctx := context.WithValue(r.Context(), handlerKey, "${plugin_utils_1.capitalize(svcName)}Routes/${plugin_utils_1.lowerCase(method.name)}")
    ${go_plugin_utils_1.parseReqBody(method)}
    ${invokeMethod(svcName, method)}
    ${sendResponse(method)}
	})
	`;
};
const buildHandlers = (svc) => {
    let handlers = '';
    for (const method of svc.methods) {
        handlers = handlers.concat(buildHandler(svc.name, method) + '\n');
    }
    return handlers;
};
const buildSvcRoutes = (svc) => {
    return `
func ${plugin_utils_1.capitalize(svc.name)}Routes(${plugin_utils_1.lowerCase(svc.name)} ${plugin_utils_1.capitalize(svc.name)}, middlewares ...func(handler http.Handler) http.Handler) chi.Router {
    rtr := chi.NewRouter()

    for _, x := range middlewares {
      rtr.Use(x)
    }
    ${buildHandlers(svc)}

    return rtr
}
`;
};
const buildRoutes = (schema) => {
    let routes = '';
    for (const svc of schema.queryServices) {
        routes = routes.concat(buildSvcRoutes(svc));
    }
    for (const svc of schema.mutationServices) {
        routes = routes.concat(buildSvcRoutes(svc));
    }
    return routes;
};
const buildFile = (schema) => {
    return {
        fileName: go_plugin_utils_1.buildFileName(schema.fileName),
        source: `
package ${schema.packageName}

import (
	"context"
	"net/http"

	"github.com/go-chi/chi"
)


${go_plugin_utils_1.buildTypes(schema.messages)}
${go_plugin_utils_1.buildInterfaces(schema)}
${buildRoutes(schema)}
`,
    };
};
const buildServer = (schemas) => {
    const querySvcNames = schemas.flatMap((schema) => schema.queryServices).flatMap((svc) => plugin_utils_1.capitalize(svc.name));
    const mutationSvcNames = schemas.flatMap((schema) => schema.mutationServices).flatMap((svc) => plugin_utils_1.capitalize(svc.name));
    const svcNames = querySvcNames.concat(mutationSvcNames);
    let services = '';
    for (const svc of svcNames) {
        services = services.concat(svc + '\n');
    }
    let endpoints = '';
    for (const svc of svcNames) {
        endpoints = endpoints.concat(`r.Mount("/${plugin_utils_1.lowerCase(svc)}", ${svc}Routes(s.${svc}))
        `);
    }
    let serverParams = '';
    let i = 0;
    while (i < svcNames.length) {
        const useComma = i === svcNames.length - 1 ? '' : ', ';
        serverParams = serverParams.concat(`${plugin_utils_1.lowerCase(svcNames[i])} ${svcNames[i]}${useComma}`);
        i++;
    }
    let serverFields = '';
    for (const svc of svcNames) {
        serverFields = serverFields.concat(`${plugin_utils_1.capitalize(svc)}: ${plugin_utils_1.lowerCase(svc)},
        `);
    }
    return `
package ${schemas[0].packageName}

import (
	"github.com/go-chi/chi"
	"net/http"
)

type ChiRPCServer struct {
  ${services}
}

func (s *ChiRPCServer) Run(address string, middlewares ...func(handler http.Handler) http.Handler) error {
	r := chi.NewRouter()
	for _, mddlwr := range middlewares {
		r.Use(mddlwr)
	}
	${endpoints}
	return http.ListenAndServe(address, r)
}

func NewChiRPCServer(${serverParams}) *ChiRPCServer  {
	return &ChiRPCServer{
		${serverFields}
	}
}
`;
};
exports.default = (schemas) => schemas
    .map((schema) => buildFile(schema))
    .concat({ fileName: 'chi.rpc.helpers.go', source: go_plugin_utils_1.serverHelpers(schemas[0]) })
    .concat({ fileName: 'chi.rpc.server.go', source: buildServer(schemas) });
//# sourceMappingURL=index.js.map