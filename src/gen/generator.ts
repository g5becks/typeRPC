/* eslint-disable no-useless-constructor */
/* eslint-disable max-params */
import { MethodSignature, SourceFile } from 'ts-morph'
import { Parser } from './parser'

/**
 *  Base class that all generators extend from, contains various utility method for parsing and generating code
 *
 * @export
 * @class Generator
 */
abstract class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly parser: Parser) { }

  protected messagesText(file: SourceFile): string {
    const messages = this.parser.getTypeAliases(file)
    let messagesText = ''
    for (const msg of messages) {
      messagesText += `${msg.getFullText()}\n`
    }

    return messagesText
  }

  protected messageSchemas(file: SourceFile): string {
    const messages = this.parser.getTypeAliases(file)
    let schemas = ''
    for (const msg of messages) {
      schemas += `${this.getSchemaForMessage(msg.getName())}\n`
    }
    return schemas
  }

  protected returnTypeSchemas(file: SourceFile): string {
    const results = this.parser.getMethodsForFile(file)
    let schemas = ''
    for (const res of results) {
      schemas += this.getSchemaForReturnType(res)
    }
    return schemas
  }

  protected servicesText(file: SourceFile): string {
    const services = this.parser.getInterfaces(file)
    let servicesText = ''
    for (const srvc of services) {
      servicesText += `${srvc.getFullText()}\n`
    }
    return servicesText
  }
  // generates the RequestGenericInterface parameter for each route
  // see https://www.fastify.io/docs/latest/TypeScript/#using-generics
  protected getIncomingMessageType(method: MethodSignature): string {
    const params = this.parser.getParams(method)
    switch (params.length) {
      case 0: {
        return '{Body: {}}'
      },
      case 1: {
        return `{Body: {${params[0]}}}`
      }
    } `{Body: {${params}}}`
  }

  protected getSchemaForMessage(symbol: string): string {
    return `const ${symbol}Schema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(symbol))}\n`
  }

  protected getSchemaForReturnType(method: MethodSignature): string {
    const returnType = this.parser.getMethodReturnType(method)
    return `const ${method.getName()}ResponseSchema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(returnType.getText()))}`
  }
}

/**
 * Abstract class that all ServerGenerator implementations extend from
 *
 * @export
 * @abstract
 * @class ServerGenerator
 * @extends {Generator}
 */
export abstract class ServerGenerator extends Generator {
  constructor(parser: Parser) {
    super(parser)
  }

  abstract async generate(): Promise<Map<string, string>>
}

/**
 * Abstract class that all ClientGenerators Extend from
 *
 * @export
 * @abstract
 * @class ClientGenerator
 * @extends {Generator}
 */
export abstract class ClientGenerator extends Generator {
  constructor(parser: Parser) {
    super(parser)
  }

  abstract async generate(): Promise<Map<string, string>>
}
