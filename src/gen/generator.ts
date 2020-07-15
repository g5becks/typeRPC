/* eslint-disable max-params */
import {EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration} from 'ts-morph'
import * as TJS from 'typescript-json-schema'

export class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly fileName: string, private readonly filePath: string, private readonly jsonGen: TJS.JsonSchemaGenerator | null, private readonly services: InterfaceDeclaration[], private readonly messages: TypeAliasDeclaration[], private readonly enums: EnumDeclaration[]) { }

  toString() {
    return `{"sourceFile": ${this.fileName}, "services": ${this.services.map(srvc => srvc.getText(false))}, "messages": ${this.messages.map(msg => msg.getText(false))}, "enums":
 ${this.enums.map(enu => enu.getText(false))}}`
  }

  private enumsText() {
    let enums = ''
    for (const enu of this.enums) {
      enums += `${enu.getFullText()}\n`
    }
    return enums
  }

  private messagesText() {
    let messages = ''
    for (const msg of this.messages) {
      messages += `${msg.getFullText()}\n`
    }

    return messages
  }

  private messageSchemas() {
    let schemas = ''
    for (const msg of this.messages) {
      schemas += `${this.getSchema(msg.getName())}\n`
    }
    return schemas
  }

  private servicesText() {
    let services = ''
    for (const srvc of this.services) {
      services += `${srvc.getFullText()}\n`
    }
    return services
  }

  getOutput() {
    return `${this.enumsText()}${this.messagesText()}${this.messageSchemas()}${this.servicesText()}`
  }

  getSchema(symbol: string) {
    return `const ${symbol}Schema = ${JSON.stringify(this.jsonGen?.getSchemaForSymbol(symbol))}\n`
  }
}
