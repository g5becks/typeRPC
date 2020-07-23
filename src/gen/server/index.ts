import {InterfaceDeclaration, MethodSignature, SourceFile} from 'ts-morph'
import {Code, ServerGenerator} from '../generator'

/**
 * Generates server side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyGenerator
 * @extends {ServerGenerator}
 */
export class FastifyGenerator extends ServerGenerator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected tsConfigFilePath: string, protected readonly outputPath: string, protected readonly jobId: string) {
    super(tsConfigFilePath, outputPath, jobId)
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
    return this.parser.getParams(method).length > 0 ? `{${payload}: ${this.requestTypeName(method)}}` : `{${payload}: {}}`
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

  // Builds a controller function for an interface definition
  private buildService(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    let handlers = ''
    service.getMethods().forEach(method => {
      handlers += this.buildRouteHandler(method, serviceName)
    })
    return `
    const ${serviceName} = (${this.lowerCase(serviceName)}: ${serviceName}): FastifyPluginAsync => async (instance, _) => {
      instance.register(fastifySensible)
    ${handlers}
}\n
 `.trimLeft()
  }

  private buildController(service: InterfaceDeclaration): string {
    const serviceName = service.getNameNode().getText()
    return `
    ${this.buildService(service)}

    export const ${serviceName}Controller = (${this.lowerCase(serviceName)}: ${serviceName}, logLevel: LogLevel, opts?: PluginOptions): TypeRpcPlugin => {
      return {plugin: fp(${serviceName}(${this.lowerCase(serviceName)}), pluginOpts('${this.lowerCase(serviceName)}Controller', opts)),
      opts: registerOptions('/${this.lowerCase(serviceName)}', logLevel)
      }
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

  private buildServerFileName(file: SourceFile): string {
    return `${file.getBaseNameWithoutExtension()}.rpc.ts`
  }

  private typesCode(): string {
    return `
import {FastifyPluginCallback, LogLevel, RegisterOptions, FastifyReply} from 'fastify'
import {PluginOptions} from 'fastify-plugin'

${this.fileHeader()}
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

export interface RpcService {
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
    const code: Code = {}
    for (const file of this.parser.sourceFiles) {
      const schemas = this.buildShemasForFile(file)
      const controllers = this.buildControllersForFile(file)
      code[this.buildServerFileName(file)] = `${this.imports(file)}${this.fileHeader()}${schemas}${controllers}`
    }
    return code
  }
}

