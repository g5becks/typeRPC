import {$, internal as x} from '@typerpc/types'
import {Node, TypeAliasDeclaration, TypeNode} from 'ts-morph'
import {isValidMsg} from './validator/utils'
import {parseJsDocComment} from './parser'

// A struct represents a Type Alias defined in a schema file
export type Struct = Readonly<{
  name: string;
  useCbor: boolean;
  toString(): string;}> & {readonly brand: unique symbol}

export type StructLiteralProp = Readonly<{
  name: string;
  type: DataType;
  isOptional: boolean;
  toString(): string;
}>

// Since all languages dont support object/class/struct literals,
// When generating code for said language,
// It is suggested to create a class/struct/object using the
// name of the owning rpc.Message + property name if used inside of an rpc.Message.
// If used as a method param, use the Service name + Method name + param name.
// If used as a method return, use the Service name + Method name + 'Result'
export type StructLiteral = Readonly<{
  properties: ReadonlyArray<StructLiteralProp>;
  toString(): string;
}>

const typeError = (type: TypeNode | Node, msg: string) =>  new TypeError(`error in file ${type.getSourceFile().getFilePath()}
    at line number: ${type.getStartLineNumber()}
    message: ${msg}`)

// Determines if the generated type should use cbor for serialization/deserialization
// based on the JsDoc @kind tag
const useCbor = (type: TypeAliasDeclaration): boolean => {
  const comment = parseJsDocComment(type,   'kind')?.trim().toLowerCase() ?? ''
  return comment.includes('cbor')
}

export const make = {
  Struct: (type: Node | TypeNode): Struct => {
    // get the text of the Type field
    const name = type.getText()?.trim()
    const alias = type.getSourceFile().getTypeAlias(name)
    if (typeof alias === 'undefined') {
      throw typeError(type, `${name} does not exist in schema file`)
    }
    return {name: type.getText()?.trim(), useCbor: useCbor(alias), toString() {
      return this.name
    }} as Struct
  },

  StructLiteralProp: (name: string, type: DataType, isOptional: boolean): StructLiteralProp => {
    return {name, type, isOptional, toString(): string {
      return `property: {
          name: ${name},
          isOptional: ${isOptional},
          type: ${type.toString()}
      }`
    }}
  },
  StructLiteral: (properties: ReadonlyArray<StructLiteralProp>): DataType => {
    return {properties, toString(): string {
      return `{${properties.map(prop => prop.toString())}}`
    }}
  },
  Dict: (keyType: DataType, valType: DataType): DataType => {
    return {keyType, valType, toString() {
      return `$.Dict<${keyType.toString()}, ${valType.toString()}>`
    }} as unknown as DataType
  },
  Tuple2: (item1: DataType, item2: DataType): DataType => {
    return {item1, item2, toString() {
      return `$.Tuple2<${item1.toString()}, ${item2.toString()}>`
    }} as unknown as DataType
  },
  Tuple3: (item1: DataType, item2: DataType, item3: DataType): DataType => {
    return {item1, item2, item3, toString() {
      return `$.Tuple3<${item1.toString()}, ${item2.toString()}, ${item3.toString()}>`
    }} as unknown as DataType
  },

  Tuple4: (item1: DataType, item2: DataType, item3: DataType, item4: DataType): DataType => {
    return {item1, item2, item3, item4, toString() {
      return `$.Tuple4<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}>`
    }} as unknown as DataType
  },

  /* eslint-disable max-params */
  Tuple5: (item1: DataType, item2: DataType, item3: DataType, item4: DataType, item5: DataType): DataType => {
    return {item1, item2, item3, item4, item5, toString() {
      return `$.Tuple5<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}, ${item5.toString()}>`
    }} as unknown as DataType
  },

  List: (dataType: DataType): DataType => {
    return {dataType, toString() {
      return `$.List<${dataType.toString()}>`
    }} as unknown as DataType
  },
  get bool(): DataType {
    return {toString: () => '$.bool'} as DataType
  },
  get int8(): DataType {
    return {toString: () => '$.int8'} as DataType
  },
  get uint8(): DataType {
    return  {toString: () => '$.uint8'} as DataType
  },
  get int16(): DataType {
    return {toString: () => '$.int16'} as DataType
  },
  get uint16(): DataType {
    return {toString: () => '$.uint16'} as DataType
  },
  get int32(): DataType {
    return {toString: () => '$.int32'} as DataType
  },
  get uint32(): DataType {
    return {toString: () => '$.uint32'} as DataType
  },
  get int64(): DataType {
    return {toString: () => '$.int64'} as DataType
  },
  get uint64(): DataType {
    return {toString: () => '$.uint64'} as DataType
  },
  get float32(): DataType {
    return {toString: () => '$.float32'} as DataType
  },
  get float64(): DataType {
    return {toString: () => '$.float64'} as DataType
  },
  get nil(): DataType {
    return {toString: () => '$.nil'} as DataType
  },
  get str(): DataType {
    return {toString: () => '$.str'} as DataType
  },
  get err(): DataType {
    return {toString: () => '$.err'} as DataType
  },
  get dyn(): DataType {
    return {toString: () => '$.dyn'} as DataType
  },
  get timestamp(): DataType {
    return {toString: () => '$.timestamp'} as DataType
  },
  get unit(): DataType {
    return {toString: () => '$.unit'} as DataType
  },
  get blob(): DataType {
    return {toString: () => '$.blob'} as DataType
  },
  primitive: (type: string): DataType|undefined => primsMap.get(type),
}

const builtPrimitives = [make.blob, make.unit, make.timestamp, make.dyn, make.err, make.str, make.nil, make.float64, make.float32, make.uint64, make.int64, make.uint32, make.int32, make.uint16, make.int16, make.uint8, make.int8, make.bool]

const primitives = ['$.blob', '$.unit', '$.timestamp', '$.dyn', '$.err', '$.str', '$.nil', '$.float64', '$.float32', '$.uint64', '$.int64', '$.uint32', '$.int32', '$.uint16', '$.int16', '$.uint8', '$.int8', '$.bool']

const primsMap = new Map<string, DataType>(primitives.map((prim, i) => [prim, builtPrimitives[i]]))

export const containers = ['$.Dict', '$.Tuple2', '$.Tuple3', '$.Tuple4', '$.Tuple5', '$.List']

// valid x to be used in client side get requests as query params
export type QueryParamablePrim = $.bool | $.timestamp | $.int8 | $.uint8 | $.int16 | $.uint16 | $.int32 | $.uint32 | $.int64 | $.uint64 | $.float32 | $.float64 | $.str

// valid container x to be used in client side get requests as query params
export type QueryParamableContainer = $.List<QueryParamablePrim>

export type QueryParamable = QueryParamableContainer | QueryParamablePrim

export const queryParamables = ['$.bool', '$.timestamp', '$.int8', '$.uint8', '$.int16', '$.uint16', '$.int32', '$.uint32', '$.uint64', '$.int64', '$.float32', '$.float64', '$.str', '$.List']

// TODO test this function
// determines if the type text is a valid QueryParamable Type
export const isQueryParamableString = (type: string): boolean => queryParamables.some(paramable => type.toString().startsWith(paramable))

export const isQueryParamable = (type: DataType): type is QueryParamable => isQueryParamableString(type.toString())

export type DataType = x.RpcType | Struct | StructLiteral

const validateType = (type: unknown, ...propNames: string[]): boolean => {
  const props = Object.getOwnPropertyNames(type).filter(prop => !prop.includes('toString'))
  return propNames.every(name => props.includes(name)) && props.length === propNames.length
}
// validate every TupleN type by ensuring it has itemN property names.
const validateTuple = (type: unknown, numItems: number): boolean => {
  let props: string[] = []
  let i = 0
  while (i < numItems) {
    props = props.concat(`item${i + 1}`)
    i++
  }
  return validateType(type, ...props)
}

// functions to validate the type of a variable
export const is = {
  Dict: (type: unknown): type is $.Dict<x.Comparable, x.Paramable> => validateType(type, 'keyType', 'valType'),
  Tuple2: (type: unknown): type is $.Tuple2<x.Paramable, x.Paramable> => validateTuple(type, 2),
  Tuple3: (type: unknown): type is $.Tuple3<x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 3),
  Tuple4: (type: unknown): type is $.Tuple4<x.Paramable, x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 4),
  Tuple5: (type: unknown): type is $.Tuple5<x.Paramable, x.Paramable, x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 5),
  List: (type: unknown): type is $.List<x.Paramable> => validateType(type, 'dataType'),
  Struct: (type: unknown): type is Struct => validateType(type, 'name', 'useCbor'),
  StructLiteral: (type: unknown): type is StructLiteral => validateType(type, 'properties'),
  Container: (type: DataType): boolean => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5, is.StructLiteral].some(func => func(type)),
}

