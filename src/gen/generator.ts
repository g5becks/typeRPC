/* eslint-disable max-params */
import {EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration} from 'ts-morph'
import * as TJS from 'typescript-json-schema'
import {Parser} from './parser'

export class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly outputPath: string, protected readonly parser: Parser, protected readonly jsonGen: TJS.JsonSchemaGenerator | null, protected readonly services: InterfaceDeclaration[], protected readonly messages: TypeAliasDeclaration[], protected readonly enums: EnumDeclaration[]) { }

  toString() {
    return `{"sourceFiles": ${this.parser.sourceFiles}, "services": ${this.services.map(srvc => srvc.getText(false))}, "messages": ${this.messages.map(msg => msg.getText(false))}, "enums":
 ${this.enums.map(enu => enu.getText(false))}}`
  }

  protected enumsText() {
    let enums = ''
    for (const enu of this.enums) {
      enums += `${enu.getFullText()}\n`
    }
    return enums
  }

  protected messagesText() {
    let messages = ''
    for (const msg of this.messages) {
      messages += `${msg.getFullText()}\n`
    }

    return messages
  }

  protected messageSchemas() {
    let schemas = ''
    for (const msg of this.messages) {
      schemas += `${this.getSchema(msg.getName())}\n`
    }
    return schemas
  }

  protected servicesText() {
    let services = ''
    for (const srvc of this.services) {
      services += `${srvc.getFullText()}\n`
    }
    return services
  }

  protected getOutput() {
    return `${this.enumsText()}${this.messagesText()}${this.messageSchemas()}${this.servicesText()}`
  }

  protected getSchema(symbol: string) {
    return `const ${symbol}Schema = ${JSON.stringify(this.jsonGen?.getSchemaForSymbol(symbol))}\n`
  }
}

export abstract class ServerGenerator extends Generator {
  abstract async generate(): Promise<void>
}

export abstract class ClientGenerator extends Generator {
  abstract async generate(): Promise<void>
}
