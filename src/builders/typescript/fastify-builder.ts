import {Code, CodeBuilder, lowerCase, ServerBuilder, Target} from '../../schema/builder'
import {InterfaceDeclaration, MethodSignature, SourceFile} from 'ts-morph'
import {getInterfaces, getParams, hasParams, hasReturn} from '../../parser'

const fastifyBuilder = {'create-server.ts':
`
import fastify, {FastifyInstance, FastifyLoggerInstance, FastifyPluginCallback, FastifyServerOptions, RegisterOptions} from 'fastify'
import http2 from 'http2'
import https from 'https'
import pino from 'pino'

/**
* Used as opts param to {@link createHttp2SecureServer} function
*
* @type {object}
 */
export type FastifyHttp2SecureOptions<
  Server extends http2.Http2SecureServer,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    http2: true;
    https: http2.SecureServerOptions;
  }

/**
 * Used as opts param to {@link createHttp2Server} function
 *
 * @type {object}
 */
export type FastifyHttp2Options<
  Server extends http2.Http2Server,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    http2: true;
    http2SessionTimeout?: number;
  }

/**
* Used as opts param to {@link createSecureServer} function
*
* @type {object}
*/
export type FastifyHttpsOptions<
  Server extends https.Server,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    https: https.ServerOptions;
  }

/**
 * Used as a container for the plugin and the options to pass to
 * fastify.register() function @see {@link https://www.fastify.io/docs/latest/TypeScript/#register}
 *
 * @type {object}
 * @property {FastifyPluginCallback} plugin the plugin to register
 * @property {RegisterOptions} opts options to pass to register function
 */
export type TypeRpcPlugin = {
  plugin: FastifyPluginCallback;
  opts: RegisterOptions;
}

/**
 * Creates a {@link FastifyInstance} with http2 and https enabled
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createHttp2SecureServer<Server extends http2.Http2SecureServer>(opts: FastifyHttp2SecureOptions<Server>, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance<Server> {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}

/**
 * Creates a {@link FastifyInstance} with https enables
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createHttp2Server<Server extends http2.Http2Server>(opts: FastifyHttp2Options<Server>, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance<Server> {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}

/**
 * Creates a {@link FastifyInstance} with https enabled
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createSecureServer<Server extends https.Server>(opts: FastifyHttpsOptions<Server>, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance<Server> {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}

/**
 * Creates a {@link FastifyInstance}
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createServer(opts: FastifyServerOptions, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}
`}

/**
 * Generates fastifyBuilder side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyBuilder
 * @extends {ServerBuilder}
 */
export class FastifyBuilder extends ServerBuilder {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly target: Target, protected tsConfigFilePath: string, protected readonly outputPath: string, protected readonly jobId: string) {
    super(target, tsConfigFilePath, outputPath, jobId)
  }

  private imports(file: SourceFile): string {
    return `
/* eslint-disable new-cap */
import {FastifyPluginAsync, LogLevel} from 'fastify'
import fastifySensible from 'fastify-sensible'
import fp, {PluginOptions} from 'fastify-plugin'
import {pluginOpts, registerOptions, TypeRpcPlugin} from './types/${this.jobId}'
${this.buildImportedTypes(file)}\n`
  }

  // generates the RequestGenericInterface parameter for each route
  // see https://www.fastify.io/docs/latest/TypeScript/#using-generics
  protected static getIncomingMessageType(method: MethodSignature): string {
    const payload = CodeBuilder.isGetMethod(method) ? 'Querystring' : 'Body'
    return getParams(method).length > 0 ? `{${payload}: ${CodeBuilder.buildRequestTypeName(method)}}` : `{${payload}: {}}`
  }

  private static buildRouteHandler(method: MethodSignature, serviceName: string): string {
    const hasParameters = hasParams(method)
    const hasReturnType = hasReturn(method)
    const schemaType = CodeBuilder.isGetMethod(method) ? 'querystring' : 'body'
    const payLoad = CodeBuilder.isGetMethod(method) ? 'query' : 'body'
    const parsePayload = `const {${CodeBuilder.buildParams(method)}} = request.${payLoad}`
    return `
    instance.route<${FastifyBuilder.getIncomingMessageType(method)}>(
        {
            method: '${CodeBuilder.buildRequestMethod(method)}',
            url: ${ServerBuilder.buildServerRoute(method)},
            schema: {
                ${schemaType}: ${hasParameters ? CodeBuilder.buildRequestTypeSchemaName(method) : false},
                response: {
                    '2xx': ${hasReturnType ? CodeBuilder.buildResponseTypeSchemeName(method) : false},
                },

            },
            handler: async (request, reply) => {
                  ${hasParameters ? parsePayload : ''}
                  const [err${hasReturnType ? ', data' : ''}] = await instance.to(${lowerCase(serviceName)}.${method.getNameNode().getText().trim()}(${hasParameters ? CodeBuilder.buildParams(method) : ''}))
                  if (err) {
                    return ${lowerCase(serviceName)}.handleErr(err, reply)
                  } else {
                    reply.send(${hasReturnType ? '{data}' : ''})
                  }
            },
        }
    )\n`
  }

  private static controllerDoc(serviceName: string): string {
    return `
/**
* Creates an Http Controller for {@link ${serviceName}}
*
* @function ${serviceName}Controller
* @param {${serviceName}} ${lowerCase(serviceName)} ${serviceName} Implementation
* @returns {FastifyPluginAsync} fastify plugin instance
*/`
  }

  // Builds a controller function for an interface definition
  private static buildController(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    let handlers = ''
    for (const method of service.getMethods()) {
      handlers += FastifyBuilder.buildRouteHandler(method, serviceName)
    }
    return `
${FastifyBuilder.controllerDoc(serviceName)}
    const ${serviceName}Controller = (${lowerCase(serviceName)}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
      instance.register(fastifySensible)
    ${handlers}
}\n
 `.trimLeft()
  }

  private static pluginDoc(serviceName: string): string {
    return `
/**
* Creates a {@link TypeRpcPlugin} for {@link ${serviceName}}
*
* @function ${serviceName}Plugin
* @param {${serviceName}} ${lowerCase(serviceName)} ${serviceName} Implementation
* @param {LogLevel} logLevel for this plugin
* @param {PluginOptions} opts options for this plugin
* @returns {TypeRpcPlugin} TypeRpcPlugin instance
*/`
  }

  private static buildPlugin(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    return `
    ${FastifyBuilder.buildController(service)}
    ${FastifyBuilder.pluginDoc(serviceName)}
    export const ${serviceName}Plugin = (${lowerCase(serviceName)}: ${serviceName}, logLevel: LogLevel, opts?: PluginOptions): TypeRpcPlugin => {
      return {plugin: fp(${serviceName}Controller(${lowerCase(serviceName)}), pluginOpts('${lowerCase(serviceName)}Controller', opts)),
      opts: registerOptions('/${lowerCase(serviceName)}', logLevel)
      }
    }\n
    `
  }

  private static buildPluginsForFile(file: SourceFile): string {
    const services = getInterfaces(file)
    let controllers = ''
    for (const service of services) {
      controllers += FastifyBuilder.buildPlugin(service)
    }
    return controllers
  }

  private static typesCode(): string {
    const handlerErr = 'handleErr<T extends RawServerBase, U extends RawRequestDefaultExpression<T>, R extends RawReplyDefaultExpression<T>, S extends RouteGenericInterface, V>(err: Error, reply: FastifyReply<T, U, R, S, V>): FastifyReply<T, U, R, S, V>;'
    return `
// eslint-disable-next-line unicorn/filename-case
import {
  FastifyPluginCallback,
  LogLevel,
  RegisterOptions,
  FastifyReply,
  RawReplyDefaultExpression,
  RawServerBase, RawRequestDefaultExpression,
} from 'fastify'
import {PluginOptions} from 'fastify-plugin'
import {RouteGenericInterface} from 'fastify/types/route'

${CodeBuilder.buildFileHeader()}

/**
 * Creates an implementation of {@link PluginOptions} for a fastify-plugin
 * @see {@link https://github.com/fastify/fastify-plugin#metadata}
 *
 * @function pluginOpts
 * @param {string} name @see {@link https://github.com/fastify/fastify-plugin#name}
 * @param {PluginOptions} opts additional options for the generated plugin
 * @returns {PluginOptions} PluginOptions
 */
export const pluginOpts = (name: string, opts?: PluginOptions): PluginOptions => {
  return {
    ...opts,
    fastify: '3.x',
    name,
  }
}

/**
 * Used as a container for the plugin and the options to pass to
 * fastify.register() function @see {@link https://www.fastify.io/docs/latest/TypeScript/#register}
 *
 * @type {object}
 * @property {FastifyPluginCallback} plugin the plugin to register
 * @property {RegisterOptions} opts options to pass to register function
 */
export type TypeRpcPlugin = {
  plugin: FastifyPluginCallback;
  opts: RegisterOptions;
}

/**
 * A helper function used for creating {@link RegisterOptions}
 *
 * @function registerOptions
 * @param {string} prefix prefix for the routes @see {@link https://www.fastify.io/docs/latest/Plugins/#plugin-options}
 * @param {LogLevel} logLevel logLevel for the plugin
 * @returns {RegisterOptions} returns the RegisterOptions
 */
export const registerOptions = (prefix: string, logLevel: LogLevel): RegisterOptions => {
  return {prefix, logLevel}
}

/**
 * Interface that all generated RpcServices inherit
 *
 * @interface RpcService
 */
export interface RpcService {
  /**
   * Used for error handling inside of generated
   * fastify handler functions
   *
   * @param {Error} err error that occurred when calling interface method
   * @param {FastifyReply} reply instance of {@link FastifyReply} used to send a reply to the client
   * @returns {FastifyReply}
   * @memberof RpcService
   */
   ${handlerErr}
}
`
  }

  public buildTypes(): Code {
    const file = `${this.jobId}.ts`
    return this.buildTypesDefault({
      [file]: FastifyBuilder.typesCode(),
    })
  }

  public buildRpc(): Code {
    const code: Code = {...fastifyBuilder}
    for (const file of this.parser.sourceFiles) {
      const schemas = this.buildShemasForFile(file)
      const controllers = FastifyBuilder.buildPluginsForFile(file)
      code[CodeBuilder.buildRpcFileName(file)] = `${this.imports(file)}${CodeBuilder.buildFileHeader()}${schemas}${controllers}`
    }
    return code
  }
}
