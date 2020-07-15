/* eslint-disable max-params */
import {SourceFile} from 'ts-morph'
import {Parser} from './parser'

export class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly outputPath: string, protected readonly parser: Parser) { }

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
      schemas += `${this.getSchema(msg.getName())}\n`
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

  protected getSchema(symbol: string) {
    return `const ${symbol}Schema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(symbol))}\n`
  }
}

export abstract class ServerGenerator extends Generator {
  abstract async generate(): Promise<void>
}

export abstract class ClientGenerator extends Generator {
  abstract async generate(): Promise<void>
}
