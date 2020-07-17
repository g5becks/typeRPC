/* eslint-disable no-useless-constructor */
/* eslint-disable max-params */
import {MethodSignature, SourceFile, TypeAliasDeclaration} from 'ts-morph'
import {Parser} from './parser'

export type Code = {
  [key: string]: string;
}

/**
 *  Base class that all generators extend from, contains various utility method for parsing and generating code
 *
 * @export
 * @class Generator
 */
abstract class Generator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly parser: Parser) { }

  protected isExportedTypeAlias(alias: TypeAliasDeclaration): boolean {
    return alias.isExported()
  }

  // Copies all type aliases from schema to output
  protected types(file: SourceFile): string {
    const aliases = this.parser.getTypeAliases(file)
    let messagesText = ''
    for (const alias of aliases) {
      if (alias.isExported()) {
        messagesText += `${alias.getFullText()}\n`
      } else {
        messagesText += `export ${alias.getFullText()}\n`
      }
    }

    return messagesText
  }

  // Copies all interfaces from schema to output
  protected interfaces(file: SourceFile): string {
    const services = this.parser.getInterfaces(file)
    let servicesText = ''
    for (const srvc of services) {
      servicesText += `${srvc.getFullText()}\n`
    }
    return servicesText
  }

  // Builds a single input type for a method
  protected buildInputType(method: MethodSignature): string {
    let typeParams = ''
    const params = this.parser.getParams(method)
    if (params.length === 0) {
      return ''
    }
    params.forEach(param => {
      typeParams += `${param.getText()}\n`
    })
    return `
    type ${method.getName()}Request = {
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
    return `type ${method.getName()}Response = {
      data: ${method.getReturnType()}
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

  private generateTypesFile(file: SourceFile): string {
    return `${this.types(file)}${this.interfaces(file)}${this.buildInputTypesForFile(file)}${this.buildReturnTypesForFile(file)}`
  }

  public generateTypes(): Code {
    const code: Code = {}
    this.parser.sourceFiles.forEach(file => {
      code[`${file.getBaseNameWithoutExtension}.rpc.types.ts`] = this.generateTypesFile(file)
    })
    return code
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

  abstract generateRpc(): Code
}
