import {Code, CodeBuilder} from '..'
import {Service, Method, Schema, is} from '../../schema'
import {capitalize, fileHeader, lowerCase, serverResponseContentType} from '../utils'
import {buildInterfaces, buildTypes, dataType, fromQueryString, makeParamsVar, paramNames} from './helpers'

const logger = `
interface ErrLogger {
  error(message: string, ...meta: any[]): void;
}

const defaultLogger: ErrLogger = {
  error(message: string, ...meta) {
    console.log(\`error occurred :\${message}, info: \${meta}\`)
  }
}`

const buildPath = (method: Method): string => {
  if (method.isGet || !method.hasParams) {
    return `/${method.name}`
  }
  let params = ''
  for (const param of method.params) {
    params = params.concat(`:${param.name}`)
  }
  return `/${method.name}/${params}`
}

// destructures the query params by converting them to the
// correct messages using the fromQueryString function
const buildDestructuredQueryParams = (method: Method): string =>
  `{${method.params.map((param, i) => {
    if (is.QueryParamable(param.type)) {
      const useComma = i === method.params.length - 1 ? '' : ','
      return `${param.name}: ${fromQueryString(`ctx.query.${param.name}`, param.type)}${useComma}`
    }
  })}}`

const destructuredParams = (method: Method): string => method.params.length === 0 ? '' : `
  ${makeParamsVar(method.params)} = ${method.isGet ? buildDestructuredQueryParams(method) : 'ctx.body'}\n
  `

const methodCall = (interfaceName: string, method: Method): string => {
  const getParams = destructuredParams(method)
  const useBraces = (args: string) => method.hasParams ? `{${args}}` : ''
  const invokeMethod = method.isVoidReturn ? '' : `const res: ${dataType(method.returnType)} = await ${interfaceName}.${method.name}(${useBraces(paramNames(method.params))})`
  const sendResponse = method.isVoidReturn ? '' : `ctx.body = ${method.hasCborReturn ? '{data: await encodeAsync(res)}' : '{data: res}'}`
  return `${getParams}\n${invokeMethod}\n${sendResponse}`
}

const setContentType = (method: Method): string => `ctx.type = ${serverResponseContentType(method)}`

const buildHandler = (interfaceName: string, method: Method): string =>  {
  return `
router.${method.httpVerb.toLowerCase()}('${interfaceName}/${method.name}', /${buildPath(method)}, async ctx => {
    try {
      ${setContentType(method)}
      ctx.status = ${method.responseCode}
      ${methodCall(interfaceName, method)}
    } catch (e) {
      logger.error(e)
      ctx.throw(${method.errorCode}, e.message)
    }
	} )\n
`
}

const buildHandlers = (interfc: Service): string => {
  let handlers = ''
  for (const method of interfc.methods) {
    handlers = handlers.concat(buildHandler(interfc.name, method))
  }
  return handlers
}

const buildRoutes = (interfc: Service): string => {
  return `
export const ${lowerCase(interfc.name)}Routes = (${lowerCase(interfc.name)}: ${capitalize(interfc.name)}, logger: ErrLogger = defaultLogger): Middleware<Koa.ParameterizedContext<any, Router.RouterParamContext>> => {
	const router = new Router<any, {}>({
		prefix: '/${interfc.name}/',
		sensitive: true
	})
  ${buildHandlers(interfc)}
	return router.routes()
}\n
`
}

const buildAllRoutes = (interfaces: ReadonlyArray<Service>): string => {
  let routes = ''
  for (const interfc of interfaces) {
    routes = routes.concat(buildRoutes(interfc))
  }
  return routes
}

const buildImports = (schema: Schema): string => {
  const cbor = `
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
${buildInterfaces(schema.services)}
${buildAllRoutes(schema.services)}
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
