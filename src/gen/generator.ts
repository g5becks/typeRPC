/* eslint-disable no-useless-constructor */
/* eslint-disable max-params */
import path from 'path'
import {Config, createGenerator} from 'ts-json-schema-generator'
import {MethodSignature, SourceFile, TypeAliasDeclaration} from 'ts-morph'
import {GeneratorError} from '.'
import {Parser} from './parser'

export type Code = {
  [key: string]: string;
}

export type RequestMethod = 'POST'|'PUT'|'GET'|'HEAD'|'DELETE'|'OPTIONS'|'PATCH'

const isRequestMethod = (method: string): method is RequestMethod => {
  return ['POST', 'PUT', 'GET', 'HEAD', 'DELETE', 'OPTIONS', 'PATCH'].includes(method)
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
  protected buildTypes(file: SourceFile): string {
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
  protected buildInterfaces(file: SourceFile): string {
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
    return `${this.buildTypes(file)}${inputTypes}`
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

  // Generates a jsonSchema for a single type
  protected buildJsonSchemaForType(filePath: string, type: string): string {
    const config: Config = {path: path.join(__dirname, filePath), type}
    try {
      return `export const ${type}Schema = ${JSON.stringify(createGenerator(config).createSchema(config.type), null, 2)}\n`
    } catch (error) {
      throw new GeneratorError(error.message)
    }
  }

  buildJsonSchemaForAllTypes(filePath: string, types: string[]): string {
    let schema = ''
    for (const type of types) {
      schema += this.buildJsonSchemaForType(filePath, type)
    }
    return schema
  }

  protected buildRequestMethod(method: MethodSignature) {
    const docs = method.getJsDocs()
    let requestMethod: RequestMethod = 'POST'
    if (docs.length > 0) {
      const rMethod = docs[0].getDescription()
      requestMethod = isRequestMethod(rMethod) ? rMethod : 'POST'
    }
    return requestMethod
  }

  private generateTypesFile(file: SourceFile): string {
    return `${this.buildTypes(file)}${this.buildInterfaces(file)}${this.buildInputTypesForFile(file)}${this.buildReturnTypesForFile(file)}`
  }

  // Generates types for the input schema file
  // Types files contain the rpc schema types along with
  // Request and Response type, but not json schemas
  public generateTypes(): Code {
    const code: Code = {}
    this.parser.sourceFiles.forEach(file => {
      code[`${file.getBaseNameWithoutExtension()}.rpc.types.ts`] = this.generateTypesFile(file)
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
