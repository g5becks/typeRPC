/* eslint-disable new-cap */
import {
  is,
  make,
  Message,
  Method,
  Param,
  Property,
  Schema,
  Service,
  DataType,
  StructLiteralProp,
  Import,
} from '../../schema'
import {capitalize, lowerCase} from '../utils'

// Maps typerpc messages to typescript data-messages
export const typesMap: Map<DataType, string> = new Map<DataType, string>(
  [
    [make.bool, 'boolean'],
    [make.int8, 'number'],
    [make.uint8, 'number'],
    [make.int16, 'number'],
    [make.uint16, 'number'],
    [make.int32, 'number'],
    [make.uint32, 'number'],
    [make.int64, 'number'],
    [make.uint64, 'number'],
    [make.float32, 'number'],
    [make.float64, 'number'],
    [make.nil, 'null'],
    [make.str, 'string'],
    [make.err, 'Error'],
    [make.dyn, 'any'],
    [make.timestamp, 'number'],
    [make.unit, 'void'],
    [make.blob, 'Uint8Array'],

  ]
)

const typeLiteral = (props: ReadonlyArray<StructLiteralProp>): string => {
  let properties = ''
  let i = 0
  while (i < props.length) {
    properties = properties.concat(`${props[i].name}${props[i].isOptional ? '?' : ''}: ${dataType(props[i].type)} ${i === props.length - 1 ? ',' : ''}\n`)
    i++
  }
  return `{
      ${properties}
  }`
}

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

  if (is.StructLiteral(type)) {
    return typeLiteral(type.properties)
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

// convert parsed querystring primitive to correct type
const primFromQueryParam = (paramName: string, type: DataType): string => {
  switch (type.toString()) {
  case make.str.toString():
    return paramName
  case make.float32.toString():
  case make.float64.toString():
    return `parseFloat(${paramName})`
  case make.bool.toString():
    return `Boolean(${paramName})`
  case make.timestamp.toString():
    return `parseInt(${paramName})`
  case make.int8.toString():
  case make.uint8.toString():
  case make.int16.toString():
  case make.uint16.toString():
  case make.int32.toString():
  case make.uint32.toString():
  case make.int64.toString():
  case make.uint64.toString():
    return `parseInt(${paramName})`
  }
  return paramName
}

// convert parsed querystring param to correct type
export const fromQueryString  = (paramName: string, type: DataType): string => {
  if (typesMap.has(type)) {
    return primFromQueryParam(paramName as string, type)
  }
  if (is.List(type)) {
    if (type.dataType.toString() === 't.str') {
      return paramName
    }
  }
  return  is.List(type) ? `${paramName}.map(val => ${primFromQueryParam('val', type.dataType)})` : paramName
}

// add question mark to optional type alias property or method param if needed
export const handleOptional = (isOptional: boolean): string => isOptional ? '?' : ''

// builds all the properties of a type alias
const buildProps = (props: ReadonlyArray<Property>): string => {
  let propsString = ''
  for (const prop of props) {
    propsString = propsString.concat(`${prop.name}${handleOptional(prop.isOptional)}: ${dataType(prop.type)}\n`)
  }
  return propsString
}

// builds a single type alias declaration
const buildType = (type: Message): string => {
  return `
export type ${capitalize(type.name)} = {
  ${buildProps(type.properties)}
}\n`
}

// builds all type aliases for a schema file
export const buildTypes = (schema: Schema): string => {
  let types =  ''
  for (const type of schema.messages) {
    types = types.concat(buildType(type))
  }
  return types
}

// builds all of the parameters of a method
const buildParams = (params: ReadonlyArray<Param>): string => {
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
const buildMethods = (methods: ReadonlyArray<Method>): string => {
  let methodsString = ''
  for (const method of methods) {
    methodsString = methodsString.concat(buildMethod(method))
  }
  return methodsString
}

// builds a single interface
const buildInterface = (interfc: Service): string => {
  return `
export interface ${capitalize(interfc.name)} {
  ${buildMethods(interfc.methods)}
}\n`
}

// builds all services of a Schema file
export const buildInterfaces = (interfaces: ReadonlyArray<Service>): string => {
  let interfacesString = ''
  for (const interfc of interfaces) {
    interfacesString = interfacesString.concat(buildInterface(interfc))
  }
  return interfacesString
}

// builds the names of the parameters of a method E.G.
// name, age, gender
export const paramNames = (params: ReadonlyArray<Param>) => {
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
export const paramsType = (params: ReadonlyArray<Param>): string => {
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
export const makeParamsVar = (params: ReadonlyArray<Param>): string => `const {${paramNames(params)}}: {${paramsType(params)}}`

// builds the import strings from Schema Imports
export const buildMsgImports = (imports: ReadonlyArray<Import>): string => {
  let importsStr = ''
  for (const imp of imports) {
    let msgs = ''
    let i = 0
    while (i < imp.messageNames.length) {
      msgs = msgs.concat(`${imp.messageNames[i]} ${i === imp.messageNames.length - 1 ? '' : ','}`)
      i++
    }
    importsStr = importsStr.concat(`import {${msgs}} from './${imp.filePath}'\n`)
  }
  return importsStr
}
