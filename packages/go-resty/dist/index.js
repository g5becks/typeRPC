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
const schema_1 = require("@typerpc/schema");
const plugin_utils_1 = require("@typerpc/plugin-utils");
const go_plugin_utils_1 = require("@typerpc/go-plugin-utils");
const helpers_1 = require("./helpers");
const buildQueryParams = (method) => {
    let paramsString = '';
    for (const param of method.params) {
        paramsString = paramsString.concat(`"${plugin_utils_1.lowerCase(param.name)}": ${go_plugin_utils_1.toQueryString(plugin_utils_1.lowerCase(param.name), param.type)},
        `);
    }
    return method.hasParams
        ? `.SetQueryParamsFromValues(url.Values{
		${paramsString}
	})`
        : '';
};
const buildRequest = (method) => {
    return `${method.hasParams && schema_1.isMutationMethod(method) ? go_plugin_utils_1.buildRequestBodyType(method) : ''}

${method.isVoidReturn ? '' : go_plugin_utils_1.buildClientResponseStruct(method.returnType)}

req := setHeaders(s.client.R(), headers...)${schema_1.isQueryMethod(method) ? buildQueryParams(method) : ''}.SetHeader("Accept", "${method.hasCborReturn ? 'application/cbor' : 'application/json'}")${schema_1.isMutationMethod(method)
        ? method.hasCborParams
            ? '.SetHeader("Content-Type", "application/cbor")'
            : '.SetHeader("Content-Type", "application/json")'
        : ''}

	err := makeRequest(ctx, requestData{
		Method:       "${method.httpMethod.toUpperCase()}",
		Request:      req,
		Url:          s.reqUrl("${plugin_utils_1.lowerCase(method.name)}"),
		CborBody:  ${schema_1.isMutationMethod(method) && method.hasCborParams ? 'true' : 'false'},
		CborResponse: ${method.hasCborReturn ? 'true' : 'false'},
		Body:         ${schema_1.isMutationMethod(method) && method.hasParams ? 'body' : 'nil'},
		Out:          ${method.isVoidReturn ? 'nil' : '&resp'},
	})

  return resp.Data, err
  `.trimStart();
};
const buildMethod = (svcName, method) => {
    if (schema_1.isQueryMethod(method)) {
    }
    return `
func (s *${plugin_utils_1.capitalize(svcName)}) ${plugin_utils_1.capitalize(method.name)}(ctx context.Context, ${go_plugin_utils_1.buildMethodParams(method.params)}${method.hasParams ? ', ' : ''} headers ...map[string]string) ${go_plugin_utils_1.buildReturnType(method.returnType)} {
  ${buildRequest(method)}
}
`;
};
const buildMethods = (svc) => {
    let methods = '';
    for (const method of svc.methods) {
        methods = methods.concat(buildMethod(svc.name, method));
    }
    return methods;
};
const buildClient = (svc) => {
    return `
type ${plugin_utils_1.capitalize(svc.name)} struct {
	client *resty.Client
	baseUrl string
}

func New${plugin_utils_1.capitalize(svc.name)}(host string) (*${svc.name}, error)  {
	_, err := url.ParseRequestURI(host)
	if err != nil {
		return nil, err
	}

	return &${plugin_utils_1.capitalize(svc.name)}{
		client: resty.New(),
		baseUrl: fmt.Sprintf("%s/${plugin_utils_1.lowerCase(svc.name)}", host),
	}, nil
}

func (s *${plugin_utils_1.capitalize(svc.name)}) reqUrl(url string) string  {
	return s.baseUrl + "/" + url
}

${buildMethods(svc)}
`;
};
const buildClients = (schema) => {
    let clients = '';
    for (const svc of schema.queryServices) {
        clients = clients.concat(buildClient(svc));
    }
    for (const svc of schema.mutationServices) {
        clients = clients.concat(buildClient(svc));
    }
    return clients;
};
const buildFile = (schema) => {
    return `
package ${schema.packageName}

import (
	"context"
	"fmt"
	"github.com/go-resty/resty"
	"net/url"
	"strconv"
)

${go_plugin_utils_1.buildTypes(schema.messages)}

${buildClients(schema)}
`;
};
const build = (schemas) => schemas
    .map((schema) => ({ fileName: go_plugin_utils_1.buildFileName(schema.fileName), source: buildFile(schema) }))
    .concat({ fileName: 'resty.rpc.helpers.go', source: helpers_1.helpers(schemas[0].packageName) });
exports.default = build;
//# sourceMappingURL=index.js.map