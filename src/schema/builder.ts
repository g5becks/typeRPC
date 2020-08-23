/* eslint-disable new-cap,  @typescript-eslint/no-use-before-define,radix */
// file deepcode ignore semicolon: eslint conflict
import {
  InterfaceDeclaration,
  MethodSignature,
  Node,
  ParameterDeclaration,
  SourceFile,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph'
import {DataType, is, make, primitives, primitivesMap} from './types'
import {isContainer, isErrCode, isHttpVerb, isPrimitive, isResponseCode, validateSchemas} from './validator'
import {Schema} from '.'
import {HTTPErrCode, HTTPResponseCode, HTTPVerb, Interface, Method, Param, Property, TypeDef} from './schema'

const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

const makeDataType = (type: TypeNode | Node): DataType => {
  const typeText = type.getText()?.trim()
  const invalids = ['', ':', '?', '}', '{', ';']
  if (invalids.includes(typeText) || typeof type === 'undefined') {
    return primitives.dyn
  }
  if (isPrimitive(typeText)) {
    return primitivesMap.get(typeText) as DataType
  }
  if (!isContainer(typeText)) {
    return makeStruct(type)
  }
  if (isType(type, 't.List')) {
    return makeList(type)
  }
  if (isType(type, 't.Dict')) {
    return makeDict(type)
  }
  if (isType(type, 't.Tuple')) {
    return makeTuple(type)
  }

  return primitives.dyn
}

// returns the type parameters portion of the type as an array
const getTypeParams = (type: Node | TypeNode): Node[] => type.getChildren()[2].getChildren().filter(child => child.getText().trim() !== ',')

const makeStruct = (type: Node | TypeNode): DataType => {
  const name = type.getText()?.trim()
  const alias = type.getSourceFile().getTypeAlias(type.getText()?.trim())
  if (typeof alias === 'undefined') {
    return make.Struct('any', false)
  }
  return make.Struct(name, useCbor(alias))
}

const makeList = (type: TypeNode | Node): DataType => make
.List(makeDataType(getTypeParams(type)[0]))

const makeDict = (type: TypeNode | Node): DataType => {
  const params = getTypeParams(type)
  return make.Dict(primitivesMap.get(params[0].getText().trim()) as DataType, makeDataType(params[1])) as DataType
}

const makeTuple = (type: TypeNode | Node): DataType => {
  const params = getTypeParams(type)
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
    return make.Tuple2(primitives.dyn, primitives.dyn)
  }
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

export const isOptional = (node: Node): boolean => node.getChildAtIndex(1).getText() === '?'

// gets the type node E.G. (name: type node) of a type alias property
export const getTypeNode = (node: Node) => isOptional(node) ? node.getChildAtIndex(3) : node.getChildAtIndex(2)

// builds all properties of a type alias
const buildProps = (properties: Node[]): Property[] =>
  properties.map(prop => {
    return {isOptional: isOptional(prop), type: makeDataType(getTypeNode(prop)), name: prop.getChildAtIndex(0).getText().trim()}
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
      return this.returnType === primitives.unit
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
