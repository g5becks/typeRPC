/* eslint-disable no-useless-constructor */
/* eslint-disable max-params */
import {MethodSignature, SourceFile} from 'ts-morph'
import {Parser} from './parser'

/**
 *  Base class that all generators extend from, contains various utility method for parsing and generating code
 *
 * @export
 * @class Generator
 */
abstract class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly parser: Parser) { }

  // Copies all type aliases from schema to output
  protected types(file: SourceFile): string {
    const messages = this.parser.getTypeAliases(file)
    let messagesText = ''
    for (const msg of messages) {
      messagesText += `${msg.getFullText()}\n`
    }

    return messagesText
  }

  // Builds a single input type for a method
  protected buildInputType(method: MethodSignature): string {
    let typeParams = ''
    const params = this.parser.getParams(method)
    params.forEach(param => {
      typeParams += `${param.getText()}\n`
    })
    return `
    type ${method.getName()}Input = {
      ${typeParams}
    }\n`
  }

  // Builds input types for all methods in a file
  // All parameters must be merged into one object and a separate type
  // alias created so that they can be used by the jsonSchemaGenerator
  protected buildInputTypesForFile(file: SourceFile): string {
    const methods = this.parser.getMethodsForFile(file)
    let inputTypes = ''
    methods.forEach(method => {
      inputTypes += `${this.buildInputType(method)}`
    })
    return `${this.types(file)}${inputTypes}`
  }

  protected buildReturnType(method: MethodSignature): string {
    return `type ${method.getName()}Return = {
      returns: ${method.getReturnType()}
    }\n`
  }

  protected buildReturnTypesForFile(file: SourceFile): string {
    const methods = this.parser.getMethodsForFile(file)
    let returnTypes = ''
    methods.forEach(method => {
      returnTypes += `${this.buildReturnType(method)}`
    })
    return returnTypes
  }

  protected returnTypeSchemas(file: SourceFile): string {
    const results = this.parser.getMethodsForFile(file)
    let schemas = ''
    for (const res of results) {
      schemas += this.getSchemaForReturnType(res)
    }
    return schemas
  }

  protected interfaces(file: SourceFile): string {
    const services = this.parser.getInterfaces(file)
    let servicesText = ''
    for (const srvc of services) {
      servicesText += `${srvc.getFullText()}\n`
    }
    return servicesText
  }

  protected getMethodInputSchema(symbol: string): string {
    return `const ${symbol}Schema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(symbol))}\n`
  }

  protected getSchemaForReturnType(method: MethodSignature): string {
    const returnType = this.parser.getMethodReturnType(method)
    return `const ${method.getName()}ResponseSchema = ${JSON.stringify(this.parser.jsonSchemaGenerator?.getSchemaForSymbol(returnType.getText()))}`
  }
}

export type Code = {
  [key: string]: string;
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

  abstract generateTypes(): Code

  abstract generateRpc(): Code
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

  abstract generateTypes(): Code

  abstract generateRpc(): Code
}
