import {InterfaceDeclaration, MethodSignature, SourceFile} from 'ts-morph'
import {Code, ServerGenerator} from '../generator'
import {Parser} from '../parser'
/**
 * Generates server side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyGenerator
 * @extends {ServerGenerator}
 */
export class FastifyGenerator extends ServerGenerator {
  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser, protected readonly outputPath: string)  {
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

  private imports(): string {
    return `
/* eslint-disable new-cap */
import {FastifyPluginAsync, LogLevel} from 'fastify'
import fp, {PluginOptions} from 'fastify-plugin'
import {pluginOpts, registerOptions, TypeRpcPlugin} from './rpc.server.util'\n`
  }

  // generates the RequestGenericInterface parameter for each route
  // see https://www.fastify.io/docs/latest/TypeScript/#using-generics
  protected getIncomingMessageType(method: MethodSignature): string {
    const params = this.parser.getParams(method)
    switch (params.length) {
    case 0:
      return '{Body: {}}'

    case 1:
      return `{Body: ${this.requestTypeName(method)}`

    default:
      return '{Body: {}}'
    }
  }

  private buildRouteHandler(method: MethodSignature): string {
    return `
    instance.route<${this.getIncomingMessageType(method)}>(
        {
            method: 'POST',
            url: '/${method.getName()}',
            schema: {
                body: ${this.requestTypeSchemaName(method)},
                response: {
                    200: ${this.responseTypeSchemeName(method)},
                },

            },
            handler: async (request, reply) => {
                const { publisher } = request.body

                reply.send({ publisher })
            },
        }
    )`
  }

  // Builds a controller function for an interface definition
  private buildController(service: InterfaceDeclaration): string {
    const serviceName = service.getName()
    return `
    const ${serviceName}Controller (${serviceName.toLowerCase()}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
    ${service.getMethods().map(method => this.buildRouteHandler(method))}
}\n
 `
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
      code[this.buildServerFileName(file)] = `${schemas}${controllers}`
    }
    return code
  }
}

