import { InterfaceDeclaration, MethodSignature, SourceFile } from 'ts-morph'
import { Code, ServerGenerator } from '../generator'
import { Parser } from '../parser'
/**
 * Generates server side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyGenerator
 * @extends {ServerGenerator}
 */
export class FastifyGenerator extends ServerGenerator {
  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser, protected readonly outputPath: string) {
    super(parser, outputPath)
  }

  private util() {
    return `
import {FastifyPluginCallback, LogLevel, RegisterOptions} from 'fastify'
import {PluginOptions} from 'fastify-plugin'

export const pluginOpts = (name: string, opts?: PluginOptions): PluginOptions => {
  return {
    ...opts,
    fastify: '3.x',
    name,
  }
}

export type TypeRpcPlugin = {
  plugin: FastifyPluginCallback;
  opts: RegisterOptions;
}

export const registerOptions = (prefix: string, logLevel: LogLevel): RegisterOptions => {
  return {prefix, logLevel}
}
`
  }

  private imports(file: SourceFile): string {
    return `
/* eslint-disable new-cap */
import {FastifyPluginAsync, LogLevel} from 'fastify'
import fastifySensible from 'fastify-sensible'
import fp, {PluginOptions} from 'fastify-plugin'
import {pluginOpts, registerOptions, TypeRpcPlugin} from './utils.rpc.server'
${this.getImportedTypes(file)}\n`
  }

  // generates the RequestGenericInterface parameter for each route
  // see https://www.fastify.io/docs/latest/TypeScript/#using-generics
  protected getIncomingMessageType(method: MethodSignature): string {
    const payload = this.isGetMethod(method) ? 'Querystring' : 'Body'
    return this.parser.getParams(method).length > 0 ? `{${payload}: ${this.requestTypeName(method)}}` : `{${payload}: {}}`
  }

  private buildRouteHandler(method: MethodSignature, serviceName: string): string {
    const schemaType = this.isGetMethod(method) ? 'querystring' : 'body'
    const payLoad = this.isGetMethod(method) ? 'query' : 'body'
    return `
    instance.register(fastifySensible)
    instance.route<${this.getIncomingMessageType(method)}>(
        {
            method: '${this.buildRequestMethod(method)}',
            url: ${this.buildServerRoute(method)},
            schema: {
                ${schemaType}: ${this.requestTypeSchemaName(method)},
                response: {
                    '2xx': ${this.responseTypeSchemeName(method)},
                },

            },
            handler: async (request, reply) => {
                const {${this.buildDestructuredParams(method)}} = request.${payLoad}

                  const [err, data] = await instance.to(${this.lowerCase(serviceName)}.${method.getNameNode().getText().trim()}(${this.buildDestructuredParams(method)}))
                  if (err) {
                    await ${this.lowerCase(serviceName)}.handleErr(err)

                  }
                reply.send({ data})
            },
        }
    )\n`
  }

  // Builds a controller function for an interface definition
  private buildController(service: InterfaceDeclaration): string {
    const serviceName = service.getName()
    let handlers = ''
    service.getMethods().forEach(method => {
      handlers += this.buildRouteHandler(method, serviceName)
    })
    return `
    export const ${serviceName}Controller = (${this.lowerCase(serviceName)}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
    ${handlers}
}\n
 `.trimLeft()
  }

  private buildControllersForFile(file: SourceFile): string {
    const services = this.parser.getInterfaces(file)
    let controllers = ''
    for (const service of services) {
      controllers += this.buildController(service)
    }
    return controllers
  }

  private utilsFile(): [string, string] {
    return ['utils.rpc.server.ts', this.util()]
  }

  private buildServerFileName(file: SourceFile): string {
    return `${file.getBaseNameWithoutExtension()}.rpc.server.ts`
  }

  public generateRpc(): Code {
    const code: Code = {}
    const util = this.utilsFile()
    code[util[0]] = util[1]
    for (const file of this.parser.sourceFiles) {
      const schemas = this.buildShemasForFile(file)
      const controllers = this.buildControllersForFile(file)
      code[this.buildServerFileName(file)] = `${this.imports(file)}${schemas}${controllers}`
    }
    return code
  }
}

