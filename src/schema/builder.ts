/* eslint-disable new-cap,  @typescript-eslint/no-use-before-define,radix */
// file deepcode ignore semicolon: eslint conflict
import {
  InterfaceDeclaration,
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertySignature,
  SourceFile,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph'
import {DataType, fetch, is, make, prims, StructLiteralProp} from './types'
import {Schema} from '.'
import {HTTPErrCode, HTTPResponseCode, HTTPVerb, Interface, Method, Param, Property, TypeDef} from './schema'
import {isContainer, isHttpVerb, isMsgLiteral, isPrimitive, isValidDataType} from './validator/utils'
import {isErrCode, isResponseCode} from './validator/service'
import {validateSchemas} from './validator'
import {parseTypeParams, parseMsgProps} from './parser'

const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

const isOptionalProp = (prop: PropertySignature): boolean => typeof prop.getQuestionTokenNode() !== 'undefined'

const makePrim = (type: TypeNode | Node): DataType => prims.get(type.getText()!.trim()) as DataType

const makeStruct = (type: Node | TypeNode): DataType => {
  // get the text of the field
  const name = type.getText()?.trim()
  // check to see if there is a type alias with this name in the file
  const alias = type.getSourceFile().getTypeAlias(name)
  if (typeof alias === 'undefined') {
    throw typeError(type, `${name} does not exist in schema file`)
  }
  return make.Struct(name, useCbor(alias))
}

const makeStructLiteralProp = (prop: PropertySignature): StructLiteralProp =>
  make.StructLiteralProp(prop.getName(), makeDataType(prop.getTypeNode()!), isOptionalProp(prop))

const makeStructLiteral = (type: Node | TypeNode): DataType => {
  const props = parseMsgProps(type)
}

const makeList = (type: TypeNode | Node): DataType => make
.List(makeDataType(parseTypeParams(type)[0]))

const makeDict = (type: TypeNode | Node): DataType => {
  const params = parseTypeParams(type)
  return make.Dict(prims.get(params[0].getText().trim()) as DataType, makeDataType(params[1])) as DataType
}

const makeTuple = (type: TypeNode | Node): DataType => {
  const params = parseTypeParams(type)
  switch (params.length) {
  case 2:
    return make.Tuple2(makeDataType(params[0]), makeDataType(params[1]))

  case 3:
    return make.Tuple3(makeDataType(params[0]), makeDataType(params[1]), makeDataType(params[2]))
  case 4:
    return make.Tuple4(makeDataType(params[0]), makeDataType(params[1]), makeDataType(params[2]), makeDataType(params[3]))
  case 5:
    return make.Tuple5(makeDataType(params[0]), makeDataType(params[1]), makeDataType(params[2]), makeDataType(params[3]), makeDataType(params[4]))
  default:
    return make.Tuple2(fetch.dyn, fetch.dyn)
  }
}
const typeError = (type: TypeNode | Node, msg: string) =>  new TypeError(`error in file ${type.getSourceFile().getFilePath()}
    at line number: ${type.getStartLineNumber()}
    message: ${msg}`)

const makeDataType = (type: TypeNode | Node): DataType => {
  const typeText = type.getText()?.trim()
  if (isValidDataType(type)) {
    throw typeError(type, `${typeText} is not a valid typerpc DataType`)
  }
  if (isPrimitive(type)) {
    return makePrim(type)
  }
  if (!isContainer(type) && !isMsgLiteral(type)) {
    return makeStruct(type)
  }
  if (!isContainer(type) && !isMsgLiteral(type)) {

  }
  if (isType(type, '$.List')) {
    return makeList(type)
  }
  if (isType(type, '$.Dict')) {
    return makeDict(type)
  }
  if (isType(type, '$.Tuple')) {
    return makeTuple(type)
  }

  return fetch.dyn
}

// gets the comment portion of a JsDoc comment base on the tagName
export const getJsDocComment = (method: MethodSignature | TypeAliasDeclaration, tagName: string): string | undefined => {
  const tags = method.getJsDocs()[0]?.getTags()
  return tags?.filter(tag => tag.getTagName() === tagName)[0]?.getComment()?.trim()
}

// builds the httpVerb for a method using the parsed JsDoc
const buildHttpVerb = (method: MethodSignature): HTTPVerb => {
  const comment = getJsDocComment(method, 'access') as HTTPVerb ?? 'POST'
  return isHttpVerb(comment) ? comment : 'POST'
}

const buildResponseCode = (method: MethodSignature): HTTPResponseCode => {
  const comment = getJsDocComment(method, 'returns')  ?? '200'
  const response = parseInt(comment)
  return isResponseCode(response) ? response as HTTPResponseCode : 200
}

// Determines if the generated type should use cbor for serialization/deserialization
// based on the JsDoc @kind tag
const useCbor = (type: TypeAliasDeclaration): boolean => {
  const comment = getJsDocComment(type,   'kind')?.trim().toLowerCase() ?? ''
  return comment.includes('cbor')
}

const buildErrCode = (method: MethodSignature): HTTPErrCode => {
  const comment = getJsDocComment(method, 'throws') ?? '500'
  const response = parseInt(comment)
  return isErrCode(response) ? response as HTTPErrCode : 500
}

// gets the type node E.G. (name: type node) of a type alias property
export const getTypeNode = (node: Node) => isOptional(node) ? node.getChildAtIndex(3) : node.getChildAtIndex(2)

// builds all properties of a type alias
const buildProps = (properties: PropertySignature[]): Property[] =>
  properties.map(prop => {
    return {isOptional: isOptionalProp(prop), type: makeDataType(getTypeNode(prop)), name: prop.getName().trim()}
  })

// Converts all type aliases found in schema files into TypeDefs
const buildTypes = (sourceFile: SourceFile): TypeDef[] => {
  const typeAliases = sourceFile.getTypeAliases()
  if (typeAliases.length === 0) {
    return []
  }

  return [...new Set(typeAliases.map(typeDef => {
    return {
      name: typeDef.getNameNode().getText().trim(),
      properties: [...new Set(buildProps(typeDef.getTypeNode()!.forEachChildAsArray())) as ReadonlySet<Property>]}
  }))]
}

const buildParams = (params: ParameterDeclaration[]): Param[] => {
  return [...new Set<Param>(params.map(param => {
    return {
      name: param.getName().trim(),
      isOptional: param.isOptional(),
      type: makeDataType(param.getTypeNode()!),
    }
  }))]
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

const buildMethod = (method: MethodSignature): Method => {
  return {
    httpVerb: buildHttpVerb(method),
    name: getMethodName(method),
    params: buildParams(method.getParameters()),
    returnType: makeDataType(method.getReturnTypeNode()!),
    responseCode: buildResponseCode(method),
    errorCode: buildErrCode(method),
    get isVoidReturn(): boolean {
      // noinspection JSDeepBugsBinOperand
      return this.returnType === fetch.unit
    },
    get isGet(): boolean {
      return this.httpVerb.toUpperCase() === 'GET'
    },
    get hasCborParams(): boolean {
      return [...this.params].some(param => is.Struct(param.type) && param.type.useCbor)
    },
    get hasCborReturn(): boolean {
      return is.Struct(this.returnType) && this.returnType.useCbor
    },
    get hasParams(): boolean {
      return this.params.length > 0
    },
  }
}

const buildMethods = (methods: MethodSignature[]): Method[] => [...new Set(methods.map(method => buildMethod(method)))]

export const getInterfaceName = (interfc: InterfaceDeclaration): string => interfc.getNameNode().getText().trim()

const buildInterface = (interfc: InterfaceDeclaration): Interface => {
  return {
    name: getInterfaceName(interfc),
    methods: buildMethods(interfc.getMethods()),
  }
}

const buildInterfaces = (sourceFile: SourceFile): Interface[] => {
  const interfaces = sourceFile.getInterfaces()
  if (interfaces.length === 0) {
    return []
  }
  return [...new Set(interfaces.map(interfc => buildInterface(interfc)))]
}

const buildSchema = (file: SourceFile): Schema => {
  return {
    fileName: file.getBaseNameWithoutExtension(),
    types: buildTypes(file),
    interfaces: buildInterfaces(file),
    get hasCbor(): boolean {
      return this.interfaces.flatMap(interfc => [...interfc.methods]).some(method => method.hasCborParams || method.hasCborReturn)
    },
  }
}

export const buildSchemas = (sourceFiles: SourceFile[]): Schema[] | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : [...new Set<Schema>(sourceFiles.map(file => buildSchema(file)))]
}

export const internalTesting = {
  isType,
  useCbor,
  buildSchema,
  buildMethod,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  buildErrCode,
  buildResponseCode,
  makeDataType,
}
