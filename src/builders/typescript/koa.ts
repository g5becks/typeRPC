import {Code, CodeBuilder} from '..'
import {MutationMethod, Param, QueryService, Schema} from '../../schema'
import {capitalize, fileHeader, lowerCase, serverResponseContentType} from '../utils'
import {
  buildInterfaces,
  buildMsgImports,
  buildTypes,
  dataType,
  fromQueryString,
  makeParamsVar,
  paramNames,
} from './utils'
import {isQueryMethod, MutationService, QueryMethod} from '../../schema/schema'

const logger = `
interface ErrLogger {
  error(message: string, ...meta: any[]): void;
}

const defaultLogger: ErrLogger = {
  error(message: string, ...meta) {
    console.log(\`error occurred :\${message}, info: \${meta}\`)
  }
}`

// builds a destructured object from query params by converting them to the
// correct types using the fromQueryString function
const buildDestructuredParams = (params: ReadonlyArray<Param>): string => params.length === 0 ? '' :
  `${makeParamsVar(params)} = {${params.map((param, i) => {
    const useComma = i === params.length - 1 ? '' : ', '
    return `${param.name}: ${fromQueryString(`ctx.query.${param.name}`, param.type)}${useComma}`
  })}}
  `

const buildMethodCall = (svcName: string, method: MutationMethod | QueryMethod): string => {
  const paramsFromBody = isQueryMethod(method) ? buildDestructuredParams(method.params) : `${makeParamsVar(method.params)} = ctx.request.body`
  const useBraces = (args: string) => method.hasParams ? `{${args}}` : ''
  const invokeMethod = method.isVoidReturn ? `await ${svcName}.${method.name}(${useBraces(paramNames(method.params))})` : `const res: ${dataType(method.returnType)} = await ${svcName}.${method.name}(${useBraces(paramNames(method.params))})`
  const sendResponse = method.isVoidReturn ? '' : `ctx.body = ${method.hasCborReturn ? '{data: await encodeAsync(res)}' : '{data: res}'}`
  return `${paramsFromBody}\n${invokeMethod}\n${sendResponse}`
}

const buildRouteHandler = (svcName: string, method: QueryMethod | MutationMethod): string => {
  return `
router.${method.httpMethod.toLowerCase()}('${svcName}/${method.name}', '/${method.name}', async ctx => {
    try {
      ctx.type == ${serverResponseContentType(method)}
      ctx.status = ${method.responseCode}
      ${buildMethodCall(svcName, method)}
    } catch (error) {
      logger.error(e)
      ctx.throw(${method.errorCode}, e.message)
    }
})\n`
}

const buildRouteHandlers = (svc: QueryService | MutationService): string => {
  let handlers = ''
  for (const method of svc.methods) {
    handlers = handlers.concat(buildRouteHandler(svc.name, method))
  }
  return handlers
}

const buildService = (svc: QueryService| MutationService): string => {
  return `
export const ${lowerCase(svc.name)}Routes = (${lowerCase(svc.name)}: ${capitalize(svc.name)}, logger: ErrLogger = defaultLogger): Middleware<Koa.ParameterizedContext<any, Router.RouterParamContext>> => {
	const router = new Router({
		prefix: '/${svc.name}/',
		sensitive: true
	})
  ${buildRouteHandlers(svc)}
	return router.routes()
}
`
}

const buildServices = (services: ReadonlyArray<QueryService> | ReadonlyArray<MutationService>): string => {
  let builtServices = ''
  for (const service of services) {
    builtServices = builtServices.concat(buildService(service))
  }
  return builtServices
}

const buildImports = (schema: Schema): string => {
  const cbor = `
${buildMsgImports(schema.imports)}
import {encodeAsync} from 'cbor'`
  const useCbor = schema.hasCbor ? cbor : ''
  return `
import Router, {Middleware} from '@koa/router'
${useCbor}
  `
}
const buildFile = (schema: Schema): Code => {
  const source = `
${buildImports(schema)}
${fileHeader()}
${logger}
${buildTypes(schema)}
${buildInterfaces(schema)}
${buildServices(schema.queryServices)}
${buildServices(schema.mutationServices)}
`
  return {fileName: schema.fileName + '.ts', source}
}

const builder = (schemas: Schema[]): Code[] => schemas.map(schema => buildFile(schema))

export const KoaBuilder:  CodeBuilder = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  builder,
}

