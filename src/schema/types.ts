import {rpc, t} from '@typerpc/types'

export type Struct = {name: string; useCbor: boolean} & {readonly brand: unique symbol}

export const make = {
  Struct: (name: string, useCbor: boolean): Struct => {
    return {name, useCbor, toString() {
      return this.name
    }} as Struct
  },

  Dict: (keyType: DataType, valType: DataType): DataType => {
    return {keyType, valType, toString() {
      return `t.Dict<${keyType.toString()}, ${valType.toString()}>`
    }} as DataType
  },
  Tuple2: (item1: DataType, item2: DataType): DataType => {
    return {item1, item2, toString() {
      return `t.Tuple2<${item1.toString()}, ${item2.toString()}>`
    }} as DataType
  },
  Tuple3: (item1: DataType, item2: DataType, item3: DataType): DataType => {
    return {item1, item2, item3, toString() {
      return `t.Tuple3<${item1.toString()}, ${item2.toString()}, ${item3.toString()}>`
    }} as DataType
  },

  Tuple4: (item1: DataType, item2: DataType, item3: DataType, item4: DataType): DataType => {
    return {item1, item2, item3, item4, toString() {
      return `t.Tuple4<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}>`
    }} as DataType
  },

  /* eslint-disable max-params */
  Tuple5: (item1: DataType, item2: DataType, item3: DataType, item4: DataType, item5: DataType): DataType => {
    return {item1, item2, item3, item4, item5, toString() {
      return `t.Tuple5<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}, ${item5.toString()}>`
    }} as DataType
  },
  /* eslint-enable max-params */
  List: (dataType: DataType): DataType => {
    return {dataType, toString() {
      return `t.List<${dataType.toString()}>`
    }} as DataType
  },
}

export const primitives: {[key: string]: rpc.Primitive} = {
  bool: {_type_: 'bool', toString: () => 't.bool'} as unknown as t.bool,
  int8: {_type_: 'int8', toString: () => 't.int8'} as unknown as t.int8,
  uint8: {_type_: 'uint8', toString: () => 't.uint8'} as unknown as t.uint8,
  int16: {_type_: 'int16', toString: () => 't.int16'} as unknown as t.int16,
  uint16: {_type_: 'uint16', toString: () => 't.uint16'} as unknown as t.uint16,
  int32: {_type_: 'int32', toString: () => 't.int32'} as unknown as t.int32,
  uint32: {_type_: 'uint32', toString: () => 't.uint32'} as unknown as t.uint32,
  int64: {_type_: 'int64', toString: () => 't.int64'} as unknown as t.int64,
  uint64: {_type_: 'uint64', toString: () => 't.uint64'} as unknown as t.uint64,
  float32: {_type_: 'float32', toString: () => 't.float32'} as unknown as t.float32,
  float64: {_type_: 'float64', toString: () => 't.float64'} as unknown as t.float64,
  nil: {_type_: 'nil', toString: () => 't.nil'} as unknown as t.nil,
  str: {_type_: 'str', toString: () => 't.str'} as unknown as t.str,
  err: {_type_: 'err', toString: () => 't.err'} as unknown as t.err,
  dyn: {_type_: 'dyn', toString: () => 't.dyn'} as unknown as t.dyn,
  timestamp: {_type_: 'timestamp', toString: () => 't.timestamp'} as unknown as t.timestamp,
  unit: {_type_: 'unit', toString: () => 't.unit'} as unknown as t.unit,
  blob: {_type_: 'blob', toString: () => 't.blob'} as unknown as t.blob,
}

// ide autocomplete isn't very helpful using the primitives object
// this object is meant to be used as an alternative
export const prim = {
  get bool(): rpc.Primitive {
    return primitives.bool
  },
  get int8(): rpc.Primitive {
    return primitives.int8
  },
  get uint8(): rpc.Primitive {
    return primitives.uint8
  },
  get int16(): rpc.Primitive {
    return primitives.int16
  },
  get uint16(): rpc.Primitive {
    return primitives.uint16
  },
  get int32(): rpc.Primitive {
    return primitives.int32
  },
  get uint32(): rpc.Primitive {
    return primitives.uint32
  },
  get int64(): rpc.Primitive {
    return primitives.int64
  },
  get uint64(): rpc.Primitive {
    return primitives.uint64
  },
  get float32(): rpc.Primitive {
    return primitives.float32
  },
  get float64(): rpc.Primitive {
    return primitives.float64
  },
  get nil(): rpc.Primitive {
    return primitives.nil
  },
  get str(): rpc.Primitive {
    return primitives.str
  },
  get err(): rpc.Primitive {
    return primitives.err
  },
  get dyn(): rpc.Primitive {
    return primitives.dyn
  },
  get timestamp(): rpc.Primitive {
    return primitives.timestamp
  },
  get unit(): rpc.Primitive {
    return primitives.unit
  },
  get blob(): rpc.Primitive {
    return primitives.blob
  },
}

type Container = rpc.Container | Struct

// valid types to be used in client side get requests as query params
export type QueryParamablePrim = t.bool | t.timestamp | t.int8 | t.uint8 | t.int16 | t.uint16 | t.int32 | t.uint32 | t.int64 | t.uint64 | t.float32 | t.float64 | t.str

// valid container types to be used in client side get requests as query params
export type QueryParamableContainer = t.List<QueryParamablePrim> | t.Tuple2<QueryParamablePrim, QueryParamablePrim> | t.Tuple3<QueryParamablePrim, QueryParamablePrim, QueryParamablePrim> | t.Tuple4<QueryParamablePrim, QueryParamablePrim, QueryParamablePrim, QueryParamablePrim> | t.Tuple5<QueryParamablePrim, QueryParamablePrim, QueryParamablePrim, QueryParamablePrim, QueryParamablePrim>

export type QueryParamable = QueryParamableContainer | QueryParamablePrim

export const queryParamablePrims = ['t.bool', 't.timestamp', 't.int8', 't.uint8', 't.int16', 't.uint16', 't.int32', 't.uint32', 't.uint64', 't.int64', 't.float32', 't.float64', 't.str']

export const queryParamableContainers = ['t.Tuple2', 't.Tuple3', 't.Tuple4', 't.Tuple5']
export const queryParamables = [...queryParamablePrims, ...queryParamableContainers]

// TODO test this function
// determines if the type text is a valid QueryParamable Type
export const isQueryParamableString = (type: string): boolean => queryParamables.some(paramable => paramable.startsWith(type))

export const isQueryParamable = (type: DataType): type is QueryParamable => isQueryParamableString(type.toString())

export type DataType = rpc.RpcType | Struct

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
  Dict: (type: unknown): type is t.Dict<rpc.Comparable, rpc.Keyable> => validateType(type, 'keyType', 'valType'),
  Tuple2: (type: unknown): type is t.Tuple2<rpc.Keyable, rpc.Keyable> => validateTuple(type, 2),
  Tuple3: (type: unknown): type is t.Tuple3<rpc.Keyable, rpc.Keyable, rpc.Keyable> => validateTuple(type, 3),
  Tuple4: (type: unknown): type is t.Tuple4<rpc.Keyable, rpc.Keyable, rpc.Keyable, rpc.Keyable> => validateTuple(type, 4),
  Tuple5: (type: unknown): type is t.Tuple5<rpc.Keyable, rpc.Keyable, rpc.Keyable, rpc.Keyable, rpc.Keyable> => validateTuple(type, 5),
  List: (type: unknown): type is t.List<rpc.Keyable> => validateType(type, 'dataType'),
  Struct: (type: unknown): type is Struct => validateType(type, 'name', 'useCbor'),
  Container: (type: DataType): type is Container => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5].some(func => func(type)),
}

export const primitivesMap = new Map<string, rpc.Primitive>(
  Object.entries(primitives).map(([_, v]) => [v.toString(), v])
)

export const containersList = ['t.Dict', 't.Tuple2', 't.Tuple3', 't.Tuple4', 't.Tuple5', 't.List']
