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
	 ${go_plugin_utils_1.buildResponseStruct(method.returnType)}
   respData, err := marshalResponse(response, ${method.hasCborReturn ? 'true' : 'false'})
   if err != nil {
    		RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})
		    return
   }
   w.Header().Set("Content-Type", "application/${method.hasCborReturn ? 'cbor' : 'json'}")
   w.WriteHeader(${method.responseCode})
   w.Write(respData)
	`;
};
const buildHandler = (svcName, method) => {
    return `
   r.${plugin_utils_1.capitalize(method.httpMethod.toLowerCase())}("/${plugin_utils_1.lowerCase(method.name)}", func(w http.ResponseWriter, r *http.Request) {
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
    r := chi.NewRouter()
    for _, x := range middlewares {
      r.Use(x)
    }
    ${buildHandlers(svc)}
    return r
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
	"time"
)

${go_plugin_utils_1.buildTypes(schema.messages)}
${go_plugin_utils_1.buildInterfaces(schema)}
${buildRoutes(schema)}
`,
    };
};
exports.default = (schemas) => schemas.map((schema) => buildFile(schema)).concat({ fileName: 'chi.helpers.rpc.go', source: go_plugin_utils_1.helpers });
//# sourceMappingURL=index.js.map