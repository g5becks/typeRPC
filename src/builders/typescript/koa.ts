import {Code, CodeBuilderPlugin} from '..'
import {MutationMethod, Param, QueryService, Schema} from '../../schema'
import {capitalize, fileHeader, lowerCase, serverResponseContentType} from '../utils'
import {
  buildInterfaces,
  buildMsgImports,
  buildTypes,
  dataType, format,
  fromQueryString,
  buildParamsVar,
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
const buildDestructuredParams = (params: ReadonlyArray<Param>): string => {
  if (params.length === 0) {
    return ''
  }
  const variable = buildParamsVar(params)
  let parsedParams = ''
  let i = 0
  while (i < params.length) {
    const parsed = fromQueryString(`ctx.query.${params[i].name}`, params[i].type)
    const useComma = i === params.length - 1 ? '' : ', '
    parsedParams = parsedParams.concat(`${params[i].name}: ${parsed}${useComma}`)
    i++
  }
  return `${variable} = {${parsedParams}}`
}

const buildMethodCall = (svcName: string, method: MutationMethod | QueryMethod): string => {
  const paramsFromBody = isQueryMethod(method) ? buildDestructuredParams(method.params) : `${buildParamsVar(method.params)} = ctx.request.body`
  const invokeMethod = method.isVoidReturn ? `await ${lowerCase(svcName)}.${method.name}(${paramNames(method.params)})` : `const res: ${dataType(method.returnType)} = await ${lowerCase(svcName)}.${method.name}(${paramNames(method.params)})`
  const sendResponse = method.isVoidReturn ? '' : `ctx.body = ${method.hasCborReturn ? '{data: await encodeAsync(res)}' : '{data: res}'}`
  return `${paramsFromBody}\n${invokeMethod}\n${sendResponse}`
}

const buildRouteHandler = (svcName: string, method: QueryMethod | MutationMethod): string => {
  return `
router.${method.httpMethod.toLowerCase()}('${svcName}/${method.name}', '/${method.name}', async ctx => {
    try {
      ${buildMethodCall(svcName, method)}
      ctx.type = ${serverResponseContentType(method)}
      ctx.status = ${method.responseCode}
    } catch (error) {
      logger.error(error)
      ctx.throw(${method.errorCode}, error.message)
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
export const ${capitalize(svc.name)} = (${lowerCase(svc.name)}: ${capitalize(svc.name)}, logger: ErrLogger = defaultLogger): Middleware<Koa.ParameterizedContext<any, Router.RouterParamContext>> => {
	const router = new Router({
		prefix: '/${lowerCase(svc.name)}/',
		sensitive: true
	})
  ${buildRouteHandlers(svc)}
	return router.routes()
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

const buildImports = (schema: Schema): string => {
  const cbor = `
import {encodeAsync} from 'cbor'`
  const useCbor = schema.hasCbor ? cbor : ''
  return `
import Koa from 'koa'
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
${buildServices(schema)}
`
  return {fileName: schema.fileName + '.ts', source}
}

const buildServerOptsType = (schemas: Schema[]): string => {
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
  return `
type ServerOptions = {
  port: number
  hostname?: string
  backlog?: number
  callback?: (...args: any[]) => void
  middleware?: Middleware<Koa.ParameterizedContext>[]
  ${services}
}
`
}

const buildRoutesMiddleware = (schemas: Schema[]): string => {
  let middleware = ''
  for (const schema of schemas) {
    for (const svc of schema.queryServices) {
      middleware = middleware.concat(`${capitalize(svc.name)}(opts.${lowerCase(svc.name)}), `)
    }
    for (const svc of schema.mutationServices) {
      middleware = middleware.concat(`${capitalize(svc.name)}(opts.${lowerCase(svc.name)}), `)
    }
  }
  return middleware
}

const buildServer = (schemas: Schema[]): Code => {
  let imports = ''
  for (const schema of schemas) {
    for (const svc of schema.queryServices) {
      imports = imports.concat(`import {${capitalize(svc.name)}} from './${schema.fileName}'
      `)
    }
    for (const svc of schema.mutationServices) {
      imports = imports.concat(`import {${capitalize(svc.name)}} from './${schema.fileName}'
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

export const runServer = (opts: ServerOptions): http.Server => {
	const app = koaQs(new Koa())
	const middlewares = [bodyParser(), cborParser(), koaHelmet(), logger(),cors(),...opts.middleware, ${buildRoutesMiddleware(schemas)}]
	middlewares.forEach(mddlwr => app.use(mddlwr))
	return app.listen(opts.port, opts.hostname, opts.backlog, opts.callback)
}
  `
  return {fileName: 'server.ts', source}
}
// builds all schemas and server file
const build = (schemas: Schema[]): Code[] => [...schemas.map(schema => buildFile(schema)), buildServer(schemas)]

export const KoaBuilder:  CodeBuilderPlugin = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  build,
  format,
}

