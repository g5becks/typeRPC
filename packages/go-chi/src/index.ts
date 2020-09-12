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

import { MutationMethod, MutationService, QueryMethod, QueryService, Schema } from '@typerpc/schema'
import { capitalize, lowerCase } from '@typerpc/plugin-utils'
import { Code } from '@typerpc/plugin'
import {
    buildFileName,
    buildInterfaces,
    buildParamNames,
    buildResponseStruct,
    buildResultDeclarations,
    buildResultInitializers,
    buildTypes,
    parseReqBody,
} from '@typerpc/go-plugin-utils'

const invokeMethod = (svcName: string, method: QueryMethod | MutationMethod): string => {
    return `
    ${buildResultDeclarations(method.returnType)}
    func() {
    defer handlePanic(w, ${method.hasCborReturn ? 'true' : 'false'})
    ${buildResultInitializers(method.returnType)} = ${lowerCase(svcName)}.${capitalize(method.name)}(ctx${
        method.hasParams ? ', ' : ''
    } ${buildParamNames(method)})
    }()`
}

const sendResponse = (method: MutationMethod | QueryMethod): string => {
    return `
  if err != nil {
		RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})
		return
	}
	 ${buildResponseStruct(method.returnType)}
   respData, err := marshalResponse(response, ${method.hasCborReturn ? 'true' : 'false'})
   if err != nil {
    		RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})
		    return
   }
   w.Header().Set("Content-Type", "application/${method.hasCborReturn ? 'cbor' : 'json'}")
   w.WriteHeader(${method.responseCode})
   w.Write(respData)
	`
}
const buildHandler = (svcName: string, method: QueryMethod | MutationMethod): string => {
    return `
   r.${capitalize(method.httpMethod.toLowerCase())}("/${lowerCase(
        method.name,
    )}", func(w http.ResponseWriter, r *http.Request) {
    var err error
    ctx := context.WithValue(r.Context(), handlerKey, "${capitalize(svcName)}Routes/${lowerCase(method.name)}")
    ${parseReqBody(method)}
    ${invokeMethod(svcName, method)}
    ${sendResponse(method)}
	})
	`
}

const buildHandlers = (svc: QueryService | MutationService): string => {
    let handlers = ''
    for (const method of svc.methods) {
        handlers = handlers.concat(buildHandler(svc.name, method) + '\n')
    }
    return handlers
}

const buildSvcRoutes = (svc: QueryService | MutationService): string => {
    return `
func ${capitalize(svc.name)}Routes(${lowerCase(svc.name)} ${capitalize(
        svc.name,
    )}, middlewares ...func(handler http.Handler) http.Handler) chi.Router {
    r := chi.NewRouter()
    for _, x := range middlewares {
      r.Use(x)
    }
    ${buildHandlers(svc)}
    return r
}
`
}

const buildRoutes = (schema: Schema): string => {
    let routes = ''
    for (const svc of schema.queryServices) {
        routes = routes.concat(buildSvcRoutes(svc))
    }
    for (const svc of schema.mutationServices) {
        routes = routes.concat(buildSvcRoutes(svc))
    }
    return routes
}
const buildFile = (schema: Schema): Code => {
    return {
        fileName: buildFileName(schema.fileName),
        source: `
package ${schema.packageName}

import (
	"context"
	"time"
)

${buildTypes(schema.messages)}
${buildInterfaces(schema)}
${buildRoutes(schema)}
`,
    }
}
export default (schemas: Schema[]): Code[] => schemas.map((schema) => buildFile(schema))
