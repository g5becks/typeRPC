import {MethodSignature, ParameterDeclaration} from 'ts-morph'
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

  private imports(): string {
    return `
/* eslint-disable new-cap */
import {FastifyPluginAsync, LogLevel} from 'fastify'
import fp, {PluginOptions} from 'fastify-plugin'
import {pluginOpts, registerOptions, TypeRpcPlugin} from './rpc.server.util'\n`
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
      return `{Body: {${this.buildBody(params)}}}`
    }
  }

  private buildBody(params: ParameterDeclaration[]): string {
    let body = ''
    params.forEach(param => {
      body += `${param}\n`
    })
    return body
  }

  private utilsFile(): [string, string] {
    return ['rpc.server.util.ts', this.util()]
  }

  generateFile(): string {
    return `${this.imports()}`
  }

  async generate(): Promise<Map<string, string>> {
    const code = new Map<string, string>()
    const util = this.utilsFile()
    code.set(util[0], util[1])
    return code
  }
}

