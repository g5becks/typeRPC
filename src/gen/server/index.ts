import {InterfaceDeclaration, MethodSignature, SourceFile} from 'ts-morph'
import {Code, ServerGenerator, Target} from '../generator'
import {server} from './server'

/**
 * Generates server side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyGenerator
 * @extends {ServerGenerator}
 */
export class FastifyGenerator extends ServerGenerator {
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
${this.getImportedTypes(file)}\n`
  }

  // generates the RequestGenericInterface parameter for each route
  // see https://www.fastify.io/docs/latest/TypeScript/#using-generics
  protected getIncomingMessageType(method: MethodSignature): string {
    const payload = this.isGetMethod(method) ? 'Querystring' : 'Body'
    return this.parser.getParams(method).length > 0 ? `{${payload}: ${this.buildRequestTypeName(method)}}` : `{${payload}: {}}`
  }

  private buildRouteHandler(method: MethodSignature, serviceName: string): string {
    const hasParams = this.parser.hasParams(method)
    const hasReturn = this.parser.hasReturn(method)
    const schemaType = this.isGetMethod(method) ? 'querystring' : 'body'
    const payLoad = this.isGetMethod(method) ? 'query' : 'body'
    const parsePayload = `const {${this.buildDestructuredParams(method)}} = request.${payLoad}`
    return `
    instance.route<${this.getIncomingMessageType(method)}>(
        {
            method: '${this.buildRequestMethod(method)}',
            url: ${this.buildServerRoute(method)},
            schema: {
                ${schemaType}: ${hasParams ? this.requestTypeSchemaName(method) : false},
                response: {
                    '2xx': ${hasReturn ? this.responseTypeSchemeName(method) : false},
                },

            },
            handler: async (request, reply) => {
                  ${hasParams ? parsePayload : ''}
                  const [err${hasReturn ? ', data' : ''}] = await instance.to(${this.lowerCase(serviceName)}.${method.getNameNode().getText().trim()}(${hasParams ? this.buildDestructuredParams(method) : ''}))
                  if (err) {
                    return ${this.lowerCase(serviceName)}.handleErr(err, reply)
                  } else {
                    reply.send(${hasReturn ? '{data}' : ''})
                  }
            },
        }
    )\n`
  }

  private controllerDoc(serviceName: string): string {
    return `
/**
* Creates an Http Controller for {@link ${serviceName}}
*
* @function ${serviceName}Controller
* @param {${serviceName}} ${this.lowerCase(serviceName)} ${serviceName} Implementation
* @returns {FastifyPluginAsync} fastify plugin instance
*/`
  }

  // Builds a controller function for an interface definition
  private buildController(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    let handlers = ''
    for (const method of service.getMethods()) {
      handlers += this.buildRouteHandler(method, serviceName)
    }
    return `
${this.controllerDoc(serviceName)}
    const ${serviceName}Controller = (${this.lowerCase(serviceName)}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
      instance.register(fastifySensible)
    ${handlers}
}\n
 `.trimLeft()
  }

  private pluginDoc(serviceName: string): string {
    return `
/**
* Creates a {@link TypeRpcPlugin} for {@link ${serviceName}}
*
* @function ${serviceName}Plugin
* @param {${serviceName}} ${this.lowerCase(serviceName)} ${serviceName} Implementation
* @param {LogLevel} logLevel for this plugin
* @param {PluginOptions} opts options for this plugin
* @returns {TypeRpcPlugin} TypeRpcPlugin instance
*/`
  }

  private buildPlugin(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    return `
    ${this.buildController(service)}
    ${this.pluginDoc(serviceName)}
    export const ${serviceName}Plugin = (${this.lowerCase(serviceName)}: ${serviceName}, logLevel: LogLevel, opts?: PluginOptions): TypeRpcPlugin => {
      return {plugin: fp(${serviceName}Controller(${this.lowerCase(serviceName)}), pluginOpts('${this.lowerCase(serviceName)}Controller', opts)),
      opts: registerOptions('/${this.lowerCase(serviceName)}', logLevel)
      }
    }\n
    `
  }

  private buildPluginsForFile(file: SourceFile): string {
    const services = this.parser.getInterfaces(file)
    let controllers = ''
    for (const service of services) {
      controllers += this.buildPlugin(service)
    }
    return controllers
  }

  private typesCode(): string {
    return `
// eslint-disable-next-line unicorn/filename-case
import {FastifyPluginCallback, LogLevel, RegisterOptions, FastifyReply} from 'fastify'
import {PluginOptions} from 'fastify-plugin'

${this.fileHeader()}

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
  handleErr(err: Error, reply: FastifyReply): FastifyReply;
}
`
  }

  public generateTypes(): Code {
    const file = `${this.jobId}.ts`
    return this.generateTypesDefault({
      [file]: this.typesCode(),
    })
  }

  public generateRpc(): Code {
    const code: Code = {...server}
    for (const file of this.parser.sourceFiles) {
      const schemas = this.buildShemasForFile(file)
      const controllers = this.buildPluginsForFile(file)
      code[this.buildRpcFileName(file)] = `${this.imports(file)}${this.fileHeader()}${schemas}${controllers}`
    }
    return code
  }
}

