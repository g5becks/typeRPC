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
import {rpc, t} from '@typerpc/types'
import {DataType, make, primitives, primitivesMap} from './types'
import {isContainer, isPrimitive, validateSchemas} from './validator'
import {Schema} from '.'
import {HTTPVerb, Interface, Method, Param, Property, TypeDef} from './schema'

const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

const makeDataType = (type: TypeNode | Node): DataType => {
  const typeText = type.getText().trim()
  if (isPrimitive(typeText)) {
    return primitivesMap.get(typeText) as DataType
  }
  if (!isContainer(typeText)) {
    return make.Struct(typeText)
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
  if (isType(type, 't.blob')) {
    return make.blob()
  }

  return primitives.dyn
}

// returns the type parameters portion of the type as an array
const getTypeParams = (type: Node | TypeNode): Node[] => type.getChildren()[2].getChildren().filter(child => child.getText().trim() !== ',')

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

const buildHttpVerb = (method: MethodSignature): HTTPVerb => {
  const docs = method.getJsDocs()
  const rMethod = docs[0]?.getDescription().trim()
  return rMethod && isHttpVerb(rMethod) ? rMethod.toUpperCase() as HTTPVerb : 'POST'
}
const isOptional = (text: string): boolean => text.endsWith('?')

const stripQuestionMark = (text: string): string =>  isOptional(text) ? text.replace('?', '') : text

const isCbor = (type: TypeAliasDeclaration): boolean => type.getJsDocs()[0]?.getDescription()?.trim()?.toLocaleLowerCase()?.includes('cbor')

// builds all properties of a type alias
const buildProps = (properties: Node[]): Property[] => {
  const props: Property[] = []
  for (const prop of properties) {
    // get property name
    const name = prop.getChildAtIndex(0).getText().trim()
    props.push({isOptional: isOptional(name), type: makeDataType(prop.getChildAtIndex(2)), name: stripQuestionMark(name)})
  }
  return props
}

const buildTypes = (sourceFile: SourceFile): ReadonlySet<TypeDef> => {
  const typeAliases = sourceFile.getTypeAliases()
  if (typeAliases.length === 0) {
    return new Set()
  }

  return new Set(typeAliases.map(typeDef => {
    return {
      useCbor: isCbor(typeDef),
      properties: new Set(buildProps(typeDef.getTypeNode()!.forEachChildAsArray())) as ReadonlySet<Property>}
  }))
}

const buildParams = (params: ParameterDeclaration[]): Param[] => {
  return params.map(param => {
    return {
      name: param.getName().trim(),
      isOptional: param.isOptional(),
      type: makeDataType(param.getTypeNode()!),
    }
  })
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

const buildMethod = (method: MethodSignature): Method => {
  return {
    httpVerb: buildHttpVerb(method),
    name: getMethodName(method),
    params: new Set(buildParams(method.getParameters())),
    returnType: makeDataType(method.getReturnTypeNode()!),
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
    fileName: file.getBaseName(),
    types: buildTypes(file),
    interfaces: buildInterfaces(file),
  }
}

export const buildSchemas = (sourceFiles: SourceFile[]): ReadonlySet<Schema> | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : new Set(sourceFiles.map(file => buildSchema(file)))
}

export const internalTesting = {
  isType,
  isCbor,
  isContainer,
  buildSchema,
  buildInterface,
  buildInterfaces,
  buildMethod,
  buildMethods,
  getMethodName,
  getInterfaceName,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  isOptional,
  makeDataType,
  stripQuestionMark,
}
