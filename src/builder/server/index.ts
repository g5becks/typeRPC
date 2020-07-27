import {InterfaceDeclaration, MethodSignature, SourceFile} from 'ts-morph'
import {Code, CodeBuilder, ServerBuilder, Target} from '../builder'
import {server} from './server'
import {getInterfaces, getParams, hasParams, hasReturn} from '../parser'

/**
 * Generates server side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyGenerator
 * @extends {ServerBuilder}
 */
export class FastifyGenerator extends ServerBuilder {
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
    instance.route<${FastifyGenerator.getIncomingMessageType(method)}>(
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
                  const [err${hasReturnType ? ', data' : ''}] = await instance.to(${CodeBuilder.lowerCase(serviceName)}.${method.getNameNode().getText().trim()}(${hasParameters ? CodeBuilder.buildParams(method) : ''}))
                  if (err) {
                    return ${CodeBuilder.lowerCase(serviceName)}.handleErr(err, reply)
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
* @param {${serviceName}} ${CodeBuilder.lowerCase(serviceName)} ${serviceName} Implementation
* @returns {FastifyPluginAsync} fastify plugin instance
*/`
  }

  // Builds a controller function for an interface definition
  private static buildController(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    let handlers = ''
    for (const method of service.getMethods()) {
      handlers += FastifyGenerator.buildRouteHandler(method, serviceName)
    }
    return `
${FastifyGenerator.controllerDoc(serviceName)}
    const ${serviceName}Controller = (${CodeBuilder.lowerCase(serviceName)}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
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
* @param {${serviceName}} ${CodeBuilder.lowerCase(serviceName)} ${serviceName} Implementation
* @param {LogLevel} logLevel for this plugin
* @param {PluginOptions} opts options for this plugin
* @returns {TypeRpcPlugin} TypeRpcPlugin instance
*/`
  }

  private static buildPlugin(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    return `
    ${FastifyGenerator.buildController(service)}
    ${FastifyGenerator.pluginDoc(serviceName)}
    export const ${serviceName}Plugin = (${CodeBuilder.lowerCase(serviceName)}: ${serviceName}, logLevel: LogLevel, opts?: PluginOptions): TypeRpcPlugin => {
      return {plugin: fp(${serviceName}Controller(${CodeBuilder.lowerCase(serviceName)}), pluginOpts('${CodeBuilder.lowerCase(serviceName)}Controller', opts)),
      opts: registerOptions('/${CodeBuilder.lowerCase(serviceName)}', logLevel)
      }
    }\n
    `
  }

  private static buildPluginsForFile(file: SourceFile): string {
    const services = getInterfaces(file)
    let controllers = ''
    for (const service of services) {
      controllers += FastifyGenerator.buildPlugin(service)
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
      [file]: FastifyGenerator.typesCode(),
    })
  }

  public buildRpc(): Code {
    const code: Code = {...server}
    for (const file of this.parser.sourceFiles) {
      const schemas = this.buildShemasForFile(file)
      const controllers = FastifyGenerator.buildPluginsForFile(file)
      code[CodeBuilder.buildRpcFileName(file)] = `${this.imports(file)}${CodeBuilder.buildFileHeader()}${schemas}${controllers}`
    }
    return code
  }
}

