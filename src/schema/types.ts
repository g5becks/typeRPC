import {t, rpc} from '@typerpc/types'

export type Struct = {name: string} & {readonly brand: unique symbol}

export const make = {
  Struct: (name: string): Struct => {
    return {name, toString() {
      return this.name
    }} as Struct
  },

  Dict: (keyType: rpc.Comparable, valType: DataType): t.Dict => {
    return {keyType, valType, toString() {
      return `t.Dict<${keyType.toString()}, ${valType.toString()}>`
    }} as t.Dict
  },
  Tuple2: (item1: DataType, item2: DataType): t.Tuple2 => {
    return {item1, item2, toString() {
      return `t.Tuple2<${item1.toString()}, ${item2.toString()}>`
    }} as t.Tuple2
  },
  Tuple3: (item1: DataType, item2: DataType, item3: DataType): t.Tuple3 => {
    return {item1, item2, item3, toString() {
      return `t.Tuple3<${item1.toString()}, ${item2.toString()}, ${item3.toString()}>`
    }} as t.Tuple3
  },

  Tuple4: (item1: DataType, item2: DataType, item3: DataType, item4: DataType): t.Tuple4 => {
    return {item1, item2, item3, item4, toString() {
      return `t.Tuple4<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}>`
    }} as t.Tuple4
  },
  Tuple5: (item1: DataType, item2: DataType, item3: DataType, item4: DataType, item5: DataType): t.Tuple5 => {
    return {item1, item2, item3, item4, item5, toString() {
      return `t.Tuple5<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}, ${item5.toString()}>`
    }} as t.Tuple5
  },
  List: (dataType: DataType): t.List => {
    return {dataType, toString() {
      return `t.List<${dataType.toString()}>`
    }} as t.List
  },
  blob: () => {
    return {data: '', toString() {
      return `t.blob`
    }} as unknown as t.blob
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
}

type Container = rpc.Container | Struct

export type DataType = rpc.RpcType | Struct

const validateType = (type: DataType, ...propNames: string[]): boolean => {
  const props = Object.getOwnPropertyNames(type)
  return propNames.every(name => props.includes(name))
}

// validate every TupleN type by ensuring it has itemN property names.
const validateTuple = (type: DataType, numItems: number): boolean => validateType(type, ...new Array(numItems).map(num => `item${num + 1}`))

// functions to validate the type of a variable
export const is = {
  Dict: (type: DataType): type is t.Dict => validateType(type, 'keyType', 'valType'),
  Tuple2: (type: DataType): type is t.Tuple2 => validateTuple(type, 2),
  Tuple3: (type: DataType): type is t.Tuple3 => validateTuple(type, 3),
  Tuple4: (type: DataType): type is t.Tuple4 => validateTuple(type, 4),
  Tuple5: (type: DataType): type is t.Tuple5 => validateTuple(type, 5),
  List: (type: DataType): type is t.List => validateType(type, 'elemType'),
  Struct: (type: DataType): type is Struct => validateType(type, 'name'),
  blob: (type: DataType): type is t.blob => validateType(type, 'data'),
  Container: (type: DataType): type is Container => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5].some(func => func(type)),
}

export const primitivesMap = new Map<string, rpc.Primitive>(
  Object.entries(primitives).map(([_, v]) => [v.toString(), v])
)
export const containersList = ['t.Dict', 't.Tuple2', 't.Tuple3', 't.Tuple4', 't.Tuple5', 't.List']
