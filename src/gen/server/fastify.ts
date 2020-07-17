import {InterfaceDeclaration, MethodSignature, ParameterDeclaration} from 'ts-morph'
import {ServerGenerator} from '../generator'
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
  constructor(parser: Parser)  {
    super(parser)
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
      return `{Body: {${params[0]}}}`

    default:
      return `{Body: {${this.buildRequestGenericInterfaceBody(params)}}}`
    }
  }

  private buildRequestGenericInterfaceBody(params: ParameterDeclaration[]): string {
    let body = ''
    params.forEach(param => {
      body += `${param}\n`
    })
    return body
  }

  private buildRouteHandler(method: MethodSignature): string {
    return `
    instance.route<${this.getIncomingMessageType(method)}>(
        {
            method: 'POST',
            url: '/${method.getName()}',
            schema: {
                body: BookSchema,
                response: {
                    200: OtherSchema,
                },

            },
            handler: async (request, reply) => {
                const { publisher } = request.body

                reply.send({ publisher })
            },
        }
    )`
  }

  private buildService(service: InterfaceDeclaration): string {
    const serviceName = service.getName()
    return `
    const ${serviceName} (${serviceName.toLowerCase()}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
    instance.route<>(
        {
            method: 'POST',
            url: '',
            schema: {
                body: BookSchema,
                response: {
                    200: OtherSchema,
                },

            },
            handler: async (request, reply) => {
                const { publisher } = request.body

                reply.send({ publisher })
            },
        }
    )
}
 `
  }

  private buildControllers(): string {

  }

  private utilsFile(): [string, string] {
    return ['rpc.server.util.ts', this.util()]
  }

  generateFile(file: SourceFile): string {
    return `${this.imports()}${this.types(file)}${this.interfaces(file)}`
  }

  generate(): Map<string, string> {
    const code = new Map<string, string>()
    const util = this.utilsFile()
    code.set(util[0], util[1])
    return code
  }
}

