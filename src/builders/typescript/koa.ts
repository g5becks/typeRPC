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
}
`

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
  const invokeMethod = method.isVoidReturn ? `await ${lowerCase(svcName)}.${method.name}(${useBraces(paramNames(method.params))})` : `const res: ${dataType(method.returnType)} = await ${lowerCase(svcName)}.${method.name}(${useBraces(paramNames(method.params))})`
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
import {encodeAsync} from 'cbor'`
  const useCbor = schema.hasCbor ? cbor : ''
  return `
import Router, {Middleware} from '@koa/router'
${useCbor}
${buildMsgImports(schema.imports)}
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

const buildServerOptsType = (schemas: Schema[]): string => {
  const type = 'type ServerOpts = {'
  const port = 'port: number,'
  const host = 'hostname?: string,'
  const backlog = 'backlog?: number,'
  const callback = 'callback?: (...args: any[]) => void'
  const mddlwr = 'middleware?: Middleware<Koa.ParameterizedContext>[]'
  let services = ''
  for (const schema of schemas) {
    for (const svc of schema.queryServices) {
      services = services.concat(`${lowerCase(svc.name)}: ${capitalize(svc.name)},
      `)
    }
    for (const svc of schema.mutationServices) {
      services = services.concat(`${lowerCase(svc.name)}: ${capitalize(svc.name)},
      `)
    }
  }
  return `${type}\n${port}\n${host}\n${backlog}\n${callback}\n${mddlwr}\n${services}
  }`
}

const buildRoutesMiddleware = (schemas: Schema[]): string => {
  let middleware = ''
  for (const schema of schemas) {
    for (const svc of schema.queryServices) {
      middleware = middleware.concat(`${lowerCase(svc.name)}Routes(opts.${lowerCase(svc.name)}), `)
    }
    for (const svc of schema.mutationServices) {
      middleware = middleware.concat(`${lowerCase(svc.name)}Routes(opts.${lowerCase(svc.name)}), `)
    }
  }
  return middleware
}

const buildServer = (schemas: Schema[]): Code => {
  let imports = ''
  for (const schema of schemas) {
    for (const svc of schema.queryServices) {
      imports = imports.concat(`import {${lowerCase(svc.name)}Routes} from './${schema.fileName}'
      `)
    }
    for (const svc of schema.mutationServices) {
      imports = imports.concat(`import {${lowerCase(svc.name)}Routes} from './${schema.fileName}'
      `)
    }
  }

  const source = `
import Koa, {Middleware} from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from '@koa/router'
import cborParser from 'koa-cbor-bodyparser'
import koaQs from 'koa-qs'
import koaHelmet from 'koa-helmet'
import cors from '@koa/cors'
import * as http from 'http'
import logger from 'koa-logger'
${imports}

${buildServerOptsType(schemas)}

export const runServer = (opts: ServerOpts): http.Server => {
	const app = koaQs(new Koa())
	const middlewares = [bodyParser(), cborParser(), koaHelmet(), logger(),cors(),...opts.middleware, ${buildRoutesMiddleware(schemas)}]
	middlewares.forEach(mddlwr => app.use(mddlwr))
	return app.listen(opts.port, opts.hostname, opts.backlog, opts.callback)
}
  `
  return {fileName: 'server.ts', source}
}
const build = (schemas: Schema[]): Code[] => [...schemas.map(schema => buildFile(schema)), buildServer(schemas)]

export const KoaBuilder:  CodeBuilder = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  build,
}

