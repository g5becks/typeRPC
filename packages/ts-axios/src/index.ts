import { Code, CodeBuilderPlugin } from '@typerpc/plugin'
import {
    buildMsgImports,
    buildParamsWithTypes,
    buildTypes,
    dataType,
    format,
    paramNames,
} from '@typerpc/ts-plugin-utils'
import { MutationMethod, QueryService, Schema, isQueryMethod, MutationService, QueryMethod } from '@typerpc/schema'
import { capitalize, clientRequestContentType, fileHeader, lowerCase } from '@typerpc/plugin-utils'

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
import {URL} from 'url'
${schema.hasCbor ? "import {encodeAsync,decodeAll} from 'cbor'" : ''}
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
    return this.client.request<${returnType}>({...cfg, ${buildRequestHeaders(method)}${buildResponseType(
        method,
    )} url: '/${method.name}', method: '${method.httpMethod}', ${method.hasParams ? buildRequestData(method) : ''}})
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
	      this.client = axios.create({...cfg, baseURL: \`\${host}/${lowerCase(svc.name)}\`})
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
${buildTypes(schema)}
${buildServices(schema)}
`
    return { fileName: schema.fileName + '.ts', source }
}

const build = (schemas: Schema[]): Code[] => schemas.map((schema) => buildFile(schema))

export const AxiosBuilder: CodeBuilderPlugin = {
    lang: 'ts',
    framework: 'axios',
    target: 'client',
    format,
    build,
}
