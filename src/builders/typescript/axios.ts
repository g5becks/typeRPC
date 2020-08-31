import {Code, CodeBuilder} from '..'
import {buildMsgImports, buildParamsWithTypes, buildTypes, dataType, format, paramNames} from './utils'
import {MutationMethod, QueryService, Schema} from '../../schema'
import {capitalize, fileHeader} from '../utils'
import {isQueryMethod, MutationService, QueryMethod} from '../../schema/schema'

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
const buildImports = (schema: Schema): string => {
  return `
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import {URL} from 'url'
${buildMsgImports(schema.imports)}

${rpcConfig}
`
}

const buildRequestData = (method: QueryMethod | MutationMethod): string =>
  isQueryMethod(method) ?
    `params: {${paramNames(method.params)}}` : `data: {${paramNames(method.params)}}`

const buildMethod = (method: MutationMethod| QueryMethod): string => {
  const returnType = dataType(method.returnType)
  return `${method.name}(${buildParamsWithTypes(method.params)}, cfg?:RpcConfig): Promise<AxiosResponse<${returnType}>> {
    return this.#client.request<${returnType}>({...cfg, method: '${method.httpMethod}', ${buildRequestData(method)}})
}
`
}

const buildMethods = (svc: MutationService| QueryService): string => {
  let methods = ''
  for (const method of svc.methods) {
    methods = methods.concat(buildMethod(method))
  }
  return methods
}
const buildService = (svc: MutationService| QueryService): string => {
  return `
export class ${capitalize(svc.name)} {
	readonly #client: AxiosInstance
	private constructor(protected readonly host: string) {
	      this.#client = axios.create({baseURL: host})
		this.#client.interceptors.response.use(response => response?.data?.data)
	}
	public static use(host: string): PersonQueries | Error {
		let url: URL
		try {
			url = new URL(urlString)
		} catch (_) {
			return new Error(\`\${host} is not a valid http(s) url\`)
		}
		return url.protocol === 'http:' || url.protocol === 'https:' ? new PersonQueries(host) : new Error(\`\${host} is not a valid http(s) url\`)
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
${buildTypes(schema)}
${buildServices(schema)}
`
  return {fileName: schema.fileName + '.ts', source}
}

const build = (schemas: Schema[]): Code[] => schemas.map(schema => buildFile(schema))

export const AxiosBuilder: CodeBuilder = {
  lang: 'ts',
  framework: 'axios',
  target: 'client',
  format,
  build,
}
