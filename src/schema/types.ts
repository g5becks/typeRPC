import * as t from '@typerpc/types'

export type Struct = {name: string} | {readonly brand: unique symbol}

export namespace containers {
  export const Dict: t.Dict = {} as unknown as t.Dict
  export const List: t.List = {} as unknown as t.List
  export const Tuple2: t.Tuple2 = {} as unknown as t.Tuple2
  export const Tuple3: t.Tuple3 = {} as unknown as t.Tuple3
  export const Tuple4: t.Tuple4 = {} as unknown as t.Tuple4
  export const Tuple5: t.Tuple5 = {} as unknown as t.Tuple5
  export const Struct: Struct = {} as unknown as Struct
}

export const make = {
  Struct: (name: string): Struct => { return {name} as Struct },

  Dict: (keyType: t.Comparable, valType: VarType): t.Dict => {
    return {keyType, valType} as t.Dict
  },
  Tuple2: (item1: VarType, item2: VarType): t.Tuple2 => {
    return {item1,item2} as t.Tuple2
  },
  Tuple3: (item1: VarType, item2: VarType, item3: VarType): t.Tuple3 => {
    return {item1,item2,item3} as t.Tuple3
  }
}


export const primitives = {
  Bool: {_type_: 'Bool'} as unknown as t.Bool,
  Int8: {_type_: 'Int8'} as unknown as t.Int8,
  Uint8: {_type_: 'Uint8'} as unknown as t.Uint8,
  Int16: {_type_: 'Int16'} as unknown as t.Int16,
  Uint16: {_type_: 'Uint16'} as unknown as t.Uint16,
  Int32: {_type_: 'Int32'} as unknown as t.Int32,
  Uint32: {_type_: 'Uint32'} as unknown as t.Uint32,
  Int64: {_type_: 'Int64'} as unknown as t.Int64,
  Uint64: {_type_: 'Uint64'} as unknown as t.Uint64,
  Float32: {_type_: 'Float32'} as unknown as t.Float32,
  Float64: {_type_: 'Float64'} as unknown as t.Float64,
  Null: {_type_: 'Null'} as unknown as t.Null,
  String: {_type_: 'String'} as unknown as t.String,
  Error: {_type_: 'Err'} as unknown as t.Err,
  Any: {_type_: 'Any'} as unknown as t.Any,
  TimeStamp: {_type_: 'TimeStamp'} as unknown as t.TimeStamp,
  Blob: {_type_: 'Blob'} as unknown as t.Blob,
}


export type Container = t.Container | Struct

export type VarType = t.RpcType | Struct

export class Param {
  constructor(public readonly name: string, public readonly type: VarType) {
  }
}

export class OptionalParam {
  constructor(public readonly name: string, public readonly type: VarType) {
  }
}

export const is = {
  Dict = (type: VarType): type is t.Dict => verifyType(type,'keyType', 'valueType')
}

const verifyType = (type: VarType, ...props: string[]): boolean => {
  const names = Object.getOwnPropertyNames(type)
  return props.every(prop => names.includes(prop))
}

export const isDict = (type: VarType): type is t.Dict => verifyType(type,'keyType', 'valueType')

export const isTuple2 = (type: VarType): type is t.Tuple2 => verifyType(type, props => props.includes('item1') && props.includes('item2'))

export const isTuple3 = (type: VarType): type is t.Tuple3 => verifyType(type, props => props.includes('item1') && props)
