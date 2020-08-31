import {Code, CodeBuilder} from '..'
import {buildMsgImports, buildTypes, format} from './utils'
import {Schema} from '../../schema'
import {fileHeader} from '../utils'

const helperCode = `
export const isValidHttpUrl = (urlString: string): boolean => {
  let url: URL
  try {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    url = new URL(urlString)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

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
type RpcResponse<T> = {
	data: T;
	status: number;
  statusText: string;
  headers: any;
}
`
const buildImports = (schema: Schema): string => {
  return `
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import {URL} from 'url'
${buildMsgImports(schema.imports)}
`
}

const buildFile = (schema: Schema): Code => {
  const source = `
${buildImports(schema)}
${fileHeader()}
${buildTypes(schema)}
${buildServices(schema.queryServices)}
${buildServices(schema.mutationServices)}
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
