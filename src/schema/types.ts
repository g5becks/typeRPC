import {internal as x,  $} from '@typerpc/types'

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

export type StructLiteral = Readonly<{
  // name to use for constructing an object in languages that dont support literals
  // defaults to owning object name + property name if used inside of an rpc.Message.
  // If used as a method param, defaults to Service name + Method name + param name.
  // If used as a method return, defaults to Service name + Method name + 'Result'
  pseudoName: string;
  properties: ReadonlyArray<StructLiteralProp>;
  toString(): string;
}>

export const make = {
  Struct: (name: string, useCbor: boolean): Struct => {
    return {name, useCbor, toString() {
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
  StructLiteral: (pseudoName: string, properties: ReadonlyArray<StructLiteralProp>): DataType => {
    return {pseudoName, properties, toString(): string {
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
  /* eslint-enable max-params */
  List: (dataType: DataType): DataType => {
    return {dataType, toString() {
      return `$.List<${dataType.toString()}>`
    }} as unknown as DataType
  },
}

export const fetch = {
  get bool(): x.Primitive {
    return {toString: () => '$.bool'} as unknown as $.bool
  },
  get int8(): x.Primitive {
    return {toString: () => '$.int8'} as unknown as $.int8
  },
  get uint8(): x.Primitive {
    return  {toString: () => '$.uint8'} as unknown as $.uint8
  },
  get int16(): x.Primitive {
    return {toString: () => '$.int16'} as unknown as $.int16
  },
  get uint16(): x.Primitive {
    return {toString: () => '$.uint16'} as unknown as $.uint16
  },
  get int32(): x.Primitive {
    return {toString: () => '$.int32'} as unknown as $.int32
  },
  get uint32(): x.Primitive {
    return {toString: () => '$.uint32'} as unknown as $.uint32
  },
  get int64(): x.Primitive {
    return {toString: () => '$.int64'} as unknown as $.int64
  },
  get uint64(): x.Primitive {
    return {toString: () => '$.uint64'} as unknown as $.uint64
  },
  get float32(): x.Primitive {
    return {toString: () => '$.float32'} as unknown as $.float32
  },
  get float64(): x.Primitive {
    return {toString: () => '$.float64'} as unknown as $.float64
  },
  get nil(): x.Primitive {
    return {toString: () => '$.nil'} as unknown as $.nil
  },
  get str(): x.Primitive {
    return {toString: () => '$.str'} as unknown as $.str
  },
  get err(): x.Primitive {
    return {toString: () => '$.err'} as unknown as $.err
  },
  get dyn(): x.Primitive {
    return {toString: () => '$.dyn'} as unknown as $.dyn
  },
  get timestamp(): x.Primitive {
    return {toString: () => '$.timestamp'} as unknown as $.timestamp
  },
  get unit(): x.Primitive {
    return {toString: () => '$.unit'} as unknown as $.unit
  },
  get blob(): x.Primitive {
    return {toString: () => '$.blob'} as unknown as $.blob
  },
}

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
  Container: (type: DataType): boolean => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5].some(func => func(type)),
}

export const primitivesMap = new Map<string, x.Primitive>(
  Object.entries(fetch).map(([_, v]) => [v.toString(), v])
)

export const containersList = ['$.Dict', '$.Tuple2', '$.Tuple3', '$.Tuple4', '$.Tuple5', '$.List']
