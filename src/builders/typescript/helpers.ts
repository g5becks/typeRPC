/* eslint-disable new-cap */
import {DataType, is, prim, primitives, QueryParamable, QueryParamablePrim} from '../../schema/types'
import {Interface, Method, Param, Property, Schema, TypeDef} from '../../schema'
import {capitalize, lowerCase} from '../utils'

// Maps typerpc types to typescript data-types
export const typesMap: Map<DataType, string> = new Map<DataType, string>(
  [
    [primitives.bool, 'boolean'],
    [primitives.int8, 'number'],
    [primitives.uint8, 'number'],
    [primitives.int16, 'number'],
    [primitives.uint16, 'number'],
    [primitives.int32, 'number'],
    [primitives.uint32, 'number'],
    [primitives.int64, 'number'],
    [primitives.uint64, 'number'],
    [primitives.float32, 'number'],
    [primitives.float64, 'number'],
    [primitives.nil, 'null'],
    [primitives.str, 'string'],
    [primitives.err, 'Error'],
    [primitives.dyn, 'any'],
    [primitives.timestamp, 'number'],
    [primitives.unit, 'void'],
    [primitives.blob, 'Uint8Array'],

  ]
)

// Converts the input DataType into a typescript representation
export const dataType = (type: DataType): string => {
  if (!is.Container(type) && !typesMap.has(type)) {
    return 'any'
  }

  if (typesMap.has(type)) {
    return typesMap.get(type)!
  }

  if (is.Dict(type)) {
    return `Map<${dataType(type.keyType)}, ${dataType(type.valType)}>`
  }

  if (is.List(type)) {
    return `Array<${dataType(type.dataType)}>`
  }

  if (is.Struct(type)) {
    return type.name
  }

  if (is.Tuple2(type)) {
    return `[${dataType(type.item1)}, ${dataType(type.item2)}]`
  }

  if (is.Tuple3(type)) {
    return `[${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}]`
  }

  if (is.Tuple4(type)) {
    return `[${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)}]`
  }

  if (is.Tuple5(type)) {
    return `[${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)}, ${dataType(type.item5)}]`
  }

  return 'any'
}

const primFromString = (text: string, type: QueryParamablePrim): string => {
  switch (type.toString()) {
  case prim.int8.toString():
  case prim.uint8.toString():
  case prim.int16.toString():
  case prim.uint16.toString():
  case prim.int32.toString():
  case prim.uint32.toString():
  case prim.int64.toString():
  case prim.uint64.toString():
    return `parseInt(${text})`
  case prim.float32.toString():
  case prim.float64.toString():
    return `parseFloat(${text})`
  case prim.bool.toString():
    return `Boolean(${text})`
  case prim.str.toString():
    return text
  case prim.timestamp.toString():
    return `parseInt(${text})`
  }
  return text
}

const fromQueryString  = (text: string, type: QueryParamable): string => {
  if (typesMap.has(type)) {
    return primFromString(text as string, type as QueryParamablePrim)
  }
  if (is.List(type)) {
    if (type.dataType.toString() === 't.str') {
      return text
    }
  }
  return  `${text}.map(val => ${primFromString(text as string, type as QueryParamablePrim)})`
}

// add question mark to optional type alias property or method param if needed
export const handleOptional = (isOptional: boolean): string => isOptional ? '?' : ''

// builds all the properties of a type alias
const buildProps = (props: Property[]): string => {
  let propsString = ''
  for (const prop of props) {
    propsString = propsString.concat(`${prop.name}${handleOptional(prop.isOptional)}: ${dataType(prop.type)}\n`)
  }
  return propsString
}

// builds a single type alias declaration
const buildType = (type: TypeDef): string => {
  return `
export type ${capitalize(type.name)} = {
  ${buildProps(type.properties)}
}\n`
}

// builds all type aliases for a schema file
export const buildTypes = (schema: Schema): string => {
  let types =  ''
  for (const type of schema.types) {
    types = types.concat(buildType(type))
  }
  return types
}

// builds all of the parameters of a method
const buildParams = (params: Param[]): string => {
  let paramsString = ''
  for (let i = 0; i < params.length; i++) {
    const useComma = i === params.length - 1 ? '' : ','
    paramsString = paramsString.concat(`${params[i].name}${handleOptional(params[i].isOptional)}: ${dataType(params[i].type)}${useComma}`)
  }
  return paramsString
}

// builds a single method of an interface
const buildMethod = (method: Method): string => {
  return `async ${lowerCase(method.name)}(${buildParams(method.params)}): Promise<${dataType(method.returnType)}>;\n`
}

// builds all methods of an interface
const buildMethods = (methods: Method[]): string => {
  let methodsString = ''
  for (const method of methods) {
    methodsString = methodsString.concat(buildMethod(method))
  }
  return methodsString
}

// builds a single interface
const buildInterface = (interfc: Interface): string => {
  return `
export interface ${capitalize(interfc.name)} {
  ${buildMethods(interfc.methods)}
}\n`
}

// builds all interfaces of a Schema file
export const buildInterfaces = (interfaces: Interface[]): string => {
  let interfacesString = ''
  for (const interfc of interfaces) {
    interfacesString = interfacesString.concat(buildInterface(interfc))
  }
  return interfacesString
}

// builds the names of the parameters of a method E.G.
// name, age, gender
export const paramNames = (params: Param[]) => {
  if (params.length === 0) {
    return ''
  }
  let names = ''
  for (let i = 0; i < params.length; i++) {
    const useComma = i === params.length - 1 ? '' : ', '
    names = names.concat(`${params[i].name}${useComma}`)
  }
  return names
}

// builds the type for destructured parameters
export const paramsType = (params: Param[]): string => {
  if (params.length === 0) {
    return ''
  }
  let paramsTypeString = ''
  for (let i = 0; i < params.length; i++) {
    const useComma = i === params.length - 1 ? '' : ', '
    paramsTypeString = paramsTypeString.concat(`${params[i].name}${handleOptional(params[i].isOptional)}: ${dataType(params[i].type)}${useComma}`)
  }
  return paramsTypeString
}

// makes a destructured parameters variable. E.G.
// const {name, age}: {name: string, age: number }
export const makeParamsVar = (params: Param[]): string => `const {${paramNames(params)}}: {${paramsType(params)}}`
