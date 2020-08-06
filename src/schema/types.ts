import {t} from '@typerpc/types'

export type Struct = {name: string} | {readonly brand: unique symbol}

export const make = {
  Struct: (name: string): Struct => {
    return {name} as Struct
  },

  Dict: (keyType: t.Comparable, valType: VarType): t.Dict => {
    return {keyType, valType} as t.Dict
  },
  Tuple2: (item1: VarType, item2: VarType): t.Tuple2 => {
    return {item1, item2} as t.Tuple2
  },
  Tuple3: (item1: VarType, item2: VarType, item3: VarType): t.Tuple3 => {
    return {item1, item2, item3} as t.Tuple3
  },

  Tuple4: (item1: VarType, item2: VarType, item3: VarType, item4: VarType): t.Tuple4 => {
    return {item1, item2, item3, item4} as t.Tuple4
  },
  Tuple5: (item1: VarType, item2: VarType, item3: VarType, item4: VarType, item5: VarType): t.Tuple5 => {
    return {item1, item2, item3, item4, item5} as t.Tuple5
  },
  List: (elemType: VarType): t.List => {
    return {elemType} as t.List
  },
}

export const primitives = {
  Bool: {_type_: 'Bool', toString: () => 't.Bool'} as unknown as t.Bool,
  Int8: {_type_: 'Int8', toString: () => 't.Int8'} as unknown as t.Int8,
  Uint8: {_type_: 'Uint8', toString: () => 't.Uint8'} as unknown as t.Uint8,
  Int16: {_type_: 'Int16', toString: () => 't.Int16'} as unknown as t.Int16,
  Uint16: {_type_: 'Uint16', toString: () => 't.Uint16'} as unknown as t.Uint16,
  Int32: {_type_: 'Int32', toString: () => 't.Int32'} as unknown as t.Int32,
  Uint32: {_type_: 'Uint32', toString: () => 't.Uint32'} as unknown as t.Uint32,
  Int64: {_type_: 'Int64', toString: () => 't.Int64'} as unknown as t.Int64,
  Uint64: {_type_: 'Uint64', toString: () => 't.Uint64'} as unknown as t.Uint64,
  Float32: {_type_: 'Float32', toString: () => 't.Float32'} as unknown as t.Float32,
  Float64: {_type_: 'Float64', toString: () => 't.Float64'} as unknown as t.Float64,
  Null: {_type_: 'Null'} as unknown as t.Null,
  String: {_type_: 'String'} as unknown as t.String,
  Error: {_type_: 'Err'} as unknown as t.Err,
  Any: {_type_: 'Any'} as unknown as t.Any,
  TimeStamp: {_type_: 'TimeStamp'} as unknown as t.TimeStamp,
  Blob: {_type_: 'Blob'} as unknown as t.Blob,
}

type Container = t.Container | Struct

export type VarType = t.RpcType | Struct

export class Param {
  constructor(public readonly name: string, public readonly type: VarType) {
  }
}

export class OptionalParam {
  constructor(public readonly name: string, public readonly type: VarType) {
  }
}

export type MethodParam = Param | OptionalParam

const validateType = (type: VarType, ...props: string[]): boolean => {
  const names = Object.getOwnPropertyNames(type)
  return props.every(prop => names.includes(prop))
}

const validateTuple = (type: VarType, numItems: number): boolean => validateType(type, ...new Array(numItems).map(num => `item${num + 1}`))

// functions to validate the type of a variable
export const is = {
  Dict: (type: VarType): type is t.Dict => validateType(type, 'keyType', 'valType'),
  Tuple2: (type: VarType): type is t.Tuple2 => validateTuple(type, 2),
  Tuple3: (type: VarType): type is t.Tuple3 => validateTuple(type, 3),
  Tuple4: (type: VarType): type is t.Tuple4 => validateTuple(type, 4),
  Tuple5: (type: VarType): type is t.Tuple5 => validateTuple(type, 5),
  List: (type: VarType): type is t.List => validateType(type, 'elemType'),
  Struct: (type: VarType): type is Struct => validateType(type, 'name'),
  Container: (type: VarType): type is Container => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5].some(func => func(type)),
  OptionalParam: (type: MethodParam): type is OptionalParam => type instanceof OptionalParam,
}

