/* eslint-disable no-useless-constructor */
/* eslint-disable max-params */
import path from 'path'
import {Config, createGenerator} from 'ts-json-schema-generator'
import {MethodSignature, SourceFile} from 'ts-morph'
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
  constructor(protected readonly parser: Parser, protected readonly outputPath: string) { }

  // Copies all type aliases from schema to output
  protected buildTypes(file: SourceFile): string {
    const aliases = file.getTypeAliases()
    let messagesText = ''
    for (const alias of aliases) {
      alias.setIsExported(true)
      messagesText += `${alias.getFullText()}\n`
    }
    return messagesText
  }

  // Copies all interfaces from schema to output
  protected buildInterfaces(file: SourceFile): string {
    const services = file.getInterfaces()
    let servicesText = ''
    for (const srvc of services) {
      srvc.setIsExported(true)
      servicesText += `${srvc.getFullText()}\n`
    }
    return servicesText
  }

  protected requestTypeName(method: MethodSignature): string {
    return `${method.getName()}Request`
  }

  // Builds a single request type for a method
  protected buildRequestType(method: MethodSignature): string {
    let typeParams = ''
    const params = this.parser.getParams(method)
    if (params.length === 0) {
      return ''
    }
    params.forEach(param => {
      typeParams += `${param.getText()}\n`
    })
    return `
   export type ${this.requestTypeName(method)} = {
      ${typeParams}
    }\n`
  }

  // Builds request types for all methods in a file
  // All parameters must be merged into one object and a separate type
  // alias created so that they can be used by the jsonSchemaGenerator
  protected buildRequestTypesForFile(file: SourceFile): string {
    const methods = this.parser.getMethodsForFile(file)
    let inputTypes = ''
    methods.forEach(method => {
      inputTypes += `${this.buildRequestType(method)}`
    })
    return `${inputTypes}`
  }

  // generates name for method response type
  protected responseTypeName(method: MethodSignature): string {
    return `${method.getName()}Response`
  }

  // builds a single response type for a method
  protected buildResponseType(method: MethodSignature): string {
    return `export type ${this.responseTypeName(method)} = {
      data: ${method.getReturnType()}
    }\n`
  }

  // builds response types for all methods in a file
  protected buildResponseTypesForFile(file: SourceFile): string {
    const methods = this.parser.getMethodsForFile(file)
    let returnTypes = ''
    methods.forEach(method => {
      returnTypes += `${this.buildResponseType(method)}`
    })
    return returnTypes
  }

  // Generates a jsonSchema for a single type
  protected buildSchemaForType(filePath: string, type: string): string {
    const config: Config = {path: path.join(__dirname, filePath), type}
    try {
      return `export const ${type}Schema = ${JSON.stringify(createGenerator(config).createSchema(config.type), null, 2)}\n`
    } catch (error) {
      throw new GeneratorError(error.message)
    }
  }

  // creates request schema variable name
  // used in subclasses during code generation to prevent string
  // concatenation and spelling mistakes
  protected requestTypeSchemaName(method: MethodSignature): string {
    return `${this.requestTypeName(method)}Schema`
  }

  // creates request schema variable name
  // used in subclasses during code generation to prevent string
  // concatenation and spelling mistakes
  protected responseTypeSchemeName(method: MethodSignature): string {
    return `${this.responseTypeName(method)}Schema`
  }

  // builds json schema for all request and response types
  // in a generated types file
  protected buildShemasForFile(file: SourceFile): string {
    const typesFile = this.getGeneratedTypesFilePath(file)
    const methods = this.parser.getMethodsForFile(file)
    const requestTypes: string[] = []
    methods.forEach(method => {
      requestTypes.push(this.requestTypeName(method))
    })
    const responseTypes: string[] = []
    methods.forEach(method => {
      responseTypes.push(this.responseTypeName(method))
    })
    const types = requestTypes.concat(...responseTypes)
    let schema = ''
    for (const type of types) {
      schema += this.buildSchemaForType(typesFile, type)
    }
    return schema
  }

  // Generates a request method based on the method signature's jsdoc
  protected buildRequestMethod(method: MethodSignature) {
    const docs = method.getJsDocs()
    let requestMethod: RequestMethod = 'POST'
    if (docs.length > 0) {
      const rMethod = docs[0].getDescription()
      requestMethod = isRequestMethod(rMethod) ? rMethod : 'POST'
    }
    return requestMethod
  }

  protected getGeneratedTypesFilePath(file: SourceFile): string {
    return `${path.join(this.outputPath, `${file.getBaseNameWithoutExtension}.rpc.types.ts`)}`
  }

  private generateTypesFile(file: SourceFile): string {
    return `${this.buildTypes(file)}${this.buildInterfaces(file)}${this.buildRequestTypesForFile(file)}${this.buildResponseTypesForFile(file)}`
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
  constructor(protected readonly parser: Parser, protected readonly outputPath: string) {
    super(parser, outputPath)
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
  constructor(protected readonly parser: Parser, protected readonly outputPath: string) {
    super(parser, outputPath)
  }

  abstract generateRpc(): Code
}
