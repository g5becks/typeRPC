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

import { Code } from '@typerpc/plugin'
import { capitalize, clientRequestContentType, fileHeader, lowerCase } from '@typerpc/plugin-utils'
import { isQueryMethod, MutationMethod, MutationService, QueryMethod, QueryService, Schema } from '@typerpc/schema'
import {
    buildMsgImports,
    buildParamsWithTypes,
    buildTypes,
    buildUnions,
    dataType,
    paramNames,
} from '@typerpc/ts-plugin-utils'

const rpcConfig = `
type Excluded =
	'url'
	| 'method'
	| 'baseURL'
	| 'transformRequest'
	| 'transformResponse'
	| 'params'
	| 'data'
	| 'responseType'

type RpcConfig = Omit<AxiosRequestConfig, Excluded>
`

const interceptor = (schema: Schema) =>
    schema.hasCbor
        ? `
const addInterceptors = (client: AxiosInstance) => {
  client.interceptors.response.use(async (response) => {
      if (response.headers['content-type'] === 'application/cbor') {
        const [data] = await decodeAll(Buffer.from(response.data))
        return { ...response, data: data?.data }
      }
      return { ...response, data: response.data?.data }
    })
  client.interceptors.request.use(async (request) => {
      if (request.headers['content-type'] === 'application/cbor') {
        request.data = await encodeAsync(request.data)
        return request
      }
      return request
    })
}
`
        : `
const addInterceptors = (client: AxiosInstance) => {
  client.interceptors.response.use(async (response) => {
      return { ...response, data: response.data?.data }
    })
}
`
const buildImports = (schema: Schema): string => {
    return `
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
${schema.hasCbor ? "import {encodeAsync,decodeAll} location 'cbor'" : ''}
${buildMsgImports(schema.imports)}
`
}

const buildResponseType = (method: QueryMethod | MutationMethod): string =>
    method.hasCborReturn ? "responseType: 'arraybuffer', " : ''

const buildRequestHeaders = (method: QueryMethod | MutationMethod): string =>
    isQueryMethod(method)
        ? ''
        : `headers : {
        ...cfg?.headers,
        'content-type': ${clientRequestContentType(method)}
      }, `
const buildRequestData = (method: QueryMethod | MutationMethod): string =>
    isQueryMethod(method) ? `params: {${paramNames(method.params)}}` : `data: {${paramNames(method.params)}}`

const buildMethod = (method: MutationMethod | QueryMethod): string => {
    const returnType = dataType(method.returnType)
    return `${method.name}(${buildParamsWithTypes(method.params)} ${
        method.hasParams ? ', ' : ''
    } cfg?:RpcConfig): Promise<AxiosResponse<${returnType}>> {
    return this.client.request<${returnType}, AxiosResponse<${returnType}>>({...cfg, ${buildRequestHeaders(
        method,
    )}${buildResponseType(method)} url: '/${method.name}', method: '${method.httpMethod}', ${
        method.hasParams ? buildRequestData(method) : ''
    }})
}
`
}

const buildMethods = (svc: MutationService | QueryService): string => {
    let methods = ''
    for (const method of svc.methods) {
        methods = methods.concat(buildMethod(method))
    }
    return methods
}
const buildService = (svc: MutationService | QueryService): string => {
    return `
export class ${capitalize(svc.name)} {
	private readonly client: AxiosInstance
	private constructor(private readonly host: string, cfg?: RpcConfig) {
	      this.client = axios.create({...cfg, baseURL: \`\${this.host}/${lowerCase(svc.name)}\`})
        addInterceptors(this.client)
	}
	public static use(host: string, cfg?: RpcConfig): ${capitalize(svc.name)} | Error {
		let url: URL
		try {
			url = new URL(host)
		} catch (_) {
			return new Error(\`\${host} is not a valid http(s) url\`)
		}
		return url.protocol === 'http:' || url.protocol === 'https:' ? new ${capitalize(
            svc.name,
        )}(host, cfg) : new Error(\`\${host} is not a valid http(s) url\`)
	}

	${buildMethods(svc)}
}
`
}

const buildServices = (schema: Schema): string => {
    let services = ''
    for (const svc of schema.queryServices) {
        services = services.concat(buildService(svc))
    }
    for (const svc of schema.mutationServices) {
        services = services.concat(buildService(svc))
    }
    return services
}

const buildFile = (schema: Schema): Code => {
    const source = `
${buildImports(schema)}
${fileHeader()}
${rpcConfig}
${interceptor(schema)}
${buildUnions(schema)}
${buildTypes(schema)}
${buildServices(schema)}
`
    return { fileName: schema.fileName + '.ts', source }
}

const build = (schemas: Schema[]): Code[] => schemas.map((schema) => buildFile(schema))

export default build
