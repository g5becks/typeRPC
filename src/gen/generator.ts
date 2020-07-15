/* eslint-disable max-params */
import {MethodSignature, SourceFile} from 'ts-morph'
import {Parser} from './parser'

export class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly parser: Parser) { }

  protected messagesText(file: SourceFile) {
    const messages = this.parser.getTypeAliases(file)
    let messagesText = ''
    for (const msg of messages) {
      messagesText += `${msg.getFullText()}\n`
    }

    return messagesText
  }

  protected messageSchemas(file: SourceFile) {
    const messages = this.parser.getTypeAliases(file)
    let schemas = ''
    for (const msg of messages) {
      schemas += `${this.getSchemaForMessage(msg.getName())}\n`
    }
    return schemas
  }

  protected returnTypeSchemas(file: SourceFile) {
    const results = this.parser.getMethodsForFile(file)
    let schemas = ''
    for (const res of results) {
      schemas += this.getSchemaForReturnType(res)
    }
    return schemas
  }

  protected servicesText(file: SourceFile) {
    const services = this.parser.getInterfaces(file)
    let servicesText = ''
    for (const srvc of services) {
      servicesText += `${srvc.getFullText()}\n`
    }
    return servicesText
  }

  protected getSchemaForMessage(symbol: string) {
    return `const ${symbol}Schema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(symbol))}\n`
  }

  protected getSchemaForReturnType(method: MethodSignature) {
    const returnType = this.parser.getMethodReturnType(method)
    return `const ${method.getName()}ResponseSchema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(returnType.getText()))}`
  }
}

export abstract class ServerGenerator extends Generator {
  abstract async generate(): Promise<string>
}

export abstract class ClientGenerator extends Generator {
  abstract async generate(): Promise<string>
}
