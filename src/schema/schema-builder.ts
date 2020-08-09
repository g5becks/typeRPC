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

const makeList = (type: TypeNode | Node): t.List => make
.List(makeDataType(type.getChildAtIndex(2)))

const makeDict = (type: TypeNode | Node): t.Dict => make.Dict(primitivesMap.get(type.getChildAtIndex(1).getText().trim()) as rpc.Comparable, makeDataType(type.getChildAtIndex(2)))

// These makeTuple Functions contain lots of duplication, but also feel like they need to be
// defined strictly. Explore alternatives in the future.
const makeTuple2 = (type: TypeNode | Node): t.Tuple2 => make.Tuple2(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)))

const makeTuple3 = (type: TypeNode | Node): t.Tuple3 => make.Tuple3(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)), makeDataType(type.getChildAtIndex(3)))

const makeTuple4 = (type: TypeNode | Node): t.Tuple4 => make.Tuple4(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)), makeDataType(type.getChildAtIndex(3)), makeDataType(type.getChildAtIndex(4)))

const makeTuple5 = (type: TypeNode | Node): t.Tuple5 => make.Tuple5(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)), makeDataType(type.getChildAtIndex(3)), makeDataType(type.getChildAtIndex(4)), makeDataType(type.getChildAtIndex(5)))

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
  if (isType(type, 't.Tuple2')) {
    return makeTuple2(type)
  }
  if (isType(type, 't.Tuple3')) {
    return makeTuple3(type)
  }
  if (isType(type, 't.Tuple4')) {
    return makeTuple4(type)
  }
  if (isType(type, 't.Tuple5')) {
    return makeTuple5(type)
  }
  if (isType(type, 't.blob')) {
    return make.blob()
  }

  return primitives.dyn
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

const isCbor = (type: TypeAliasDeclaration): boolean => type.getJsDocs()[0]?.getDescription().trim().toLocaleLowerCase().includes('cbor')

const buildProps = (properties: Node[]): Property[] => {
  const props: Property[] = []
  for (const prop of properties) {
    const name = prop.getChildAtIndex(0).getText().trim()
    props.push({isOptional: isOptional(name), type: makeDataType(prop.getChildAtIndex(2)), name: stripQuestionMark(name)})
  }
  return props
}

const buildTypes = (sourceFile: SourceFile): ReadonlySet<TypeDef> => {
  const typeAliases = sourceFile.getTypeAliases()
  if (!typeAliases.length) {
    return new Set()
  }

  return new Set(typeAliases.map(typeDef => {
    {
      return {
        useCbor: isCbor(typeDef),
        properties: new Set(buildProps(typeDef.getTypeNode()!.forEachChildAsArray())) as ReadonlySet<Property>}
    }
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

const buildMethod = (method: MethodSignature): Method => {
  return {
    httpVerb: buildHttpVerb(method),
    params: new Set(buildParams(method.getParameters())),
    returnType: makeDataType(method.getReturnTypeNode()!),
  }
}

const buildMethods = (methods: MethodSignature[]): ReadonlySet<Method> => new Set(methods.map(method => buildMethod(method)))

const buildInterface = (interfc: InterfaceDeclaration): Interface => {
  return {
    name: interfc.getName().trim(),
    methods: buildMethods(interfc.getMethods()),
  }
}

const buildInterfaces = (sourceFile: SourceFile): ReadonlySet<Interface> => {
  const interfaces = sourceFile.getInterfaces()
  if (!interfaces.length) {
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
