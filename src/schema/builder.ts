/* eslint-disable new-cap,  @typescript-eslint/no-use-before-define */
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
import {isContainer, isPrimitive, validateSchemas} from './validator'
import {Schema} from '.'
import {HTTPVerb, Interface, Method, Param, Property, TypeDef} from './schema'

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
  return make.Struct(name, isCbor(alias))
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

const isHttpVerb = (method: string): method is HTTPVerb => {
  return ['POST', 'PUT', 'GET', 'HEAD', 'DELETE', 'OPTIONS', 'PATCH'].includes(method)
}

// builds the httpVerb for a method using the parsed JsDoc
const buildHttpVerb = (method: MethodSignature): HTTPVerb => {
  const docs = method.getJsDocs()
  const rMethod = docs[0]?.getDescription().trim()
  return rMethod && isHttpVerb(rMethod) ? rMethod.toUpperCase() as HTTPVerb : 'POST'
}
export const isOptional = (node: Node): boolean => node.getChildAtIndex(1).getText() === '?'

// gets the type node E.G. (name: type node) of a type alias property
export const getTypeNode = (node: Node) => isOptional(node) ? node.getChildAtIndex(3) : node.getChildAtIndex(2)

const isCbor = (type: TypeAliasDeclaration): boolean => Boolean(type.getJsDocs()[0]?.getDescription()?.trim()?.toLocaleLowerCase()?.includes('cbor'))

// builds all properties of a type alias
const buildProps = (properties: Node[]): Property[] =>
  properties.map(prop => {
    return {isOptional: isOptional(prop), type: makeDataType(getTypeNode(prop)), name: prop.getChildAtIndex(0).getText().trim()}
  })

// Converts all type aliases found in schema files into TypeDefs
const buildTypes = (sourceFile: SourceFile): ReadonlySet<TypeDef> => {
  const typeAliases = sourceFile.getTypeAliases()
  if (typeAliases.length === 0) {
    return new Set()
  }

  return new Set(typeAliases.map(typeDef => {
    return {
      name: typeDef.getNameNode().getText().trim(),
      properties: new Set(buildProps(typeDef.getTypeNode()!.forEachChildAsArray())) as ReadonlySet<Property>}
  }))
}

const buildParams = (params: ParameterDeclaration[]): ReadonlySet<Param> => {
  return new Set<Param>(params.map(param => {
    return {
      name: param.getName().trim(),
      isOptional: param.isOptional(),
      type: makeDataType(param.getTypeNode()!),
    }
  }))
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

const buildMethod = (method: MethodSignature): Method => {
  return {
    httpVerb: buildHttpVerb(method),
    name: getMethodName(method),
    params: buildParams(method.getParameters()),
    returnType: makeDataType(method.getReturnTypeNode()!),
    cborParams(): boolean {
      return [...this.params].some(param => is.Struct(param.type) && param.type.useCbor)
    },
    cborReturn(): boolean {
      return is.Struct(this.returnType) && this.returnType.useCbor
    },
    hasParams(): boolean {
      return Boolean(this.params.keys.length)
    },
  }
}

const buildMethods = (methods: MethodSignature[]): ReadonlySet<Method> => new Set(methods.map(method => buildMethod(method)))

export const getInterfaceName = (interfc: InterfaceDeclaration): string => interfc.getNameNode().getText().trim()

const buildInterface = (interfc: InterfaceDeclaration): Interface => {
  return {
    name: getInterfaceName(interfc),
    methods: buildMethods(interfc.getMethods()),
  }
}

const buildInterfaces = (sourceFile: SourceFile): ReadonlySet<Interface> => {
  const interfaces = sourceFile.getInterfaces()
  if (interfaces.length === 0) {
    return new Set()
  }
  return new Set(interfaces.map(interfc => buildInterface(interfc)))
}

const buildSchema = (file: SourceFile): Schema => {
  return {
    fileName: file.getBaseNameWithoutExtension(),
    types: buildTypes(file),
    interfaces: buildInterfaces(file),
  }
}

export const buildSchemas = (sourceFiles: SourceFile[]): ReadonlySet<Schema> | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : new Set<Schema>(sourceFiles.map(file => buildSchema(file)))
}

export const internalTesting = {
  isType,
  isCbor,
  buildSchema,
  buildMethod,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  makeDataType,
}
