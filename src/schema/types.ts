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

export namespace primitives {
  export const Bool: t.Bool = {} as unknown as t.Bool
  export const Int8: t.Int8 = {} as unknown as t.Int8
  export const Uint8: t.Uint8 = {} as unknown as t.Uint8
  export const Int16: t.Int16 = {} as unknown as t.Int16
  export const Uint16: t.Uint16 =  {} as unknown as t.Uint16
  export const Int32: t.Int32 = {} as unknown as t.Int32
  export const Uint32: t.Uint32 = {} as unknown as t.Uint32
  export const Int64: t.Int64 = {} as unknown as t.Int64
  export const Uint64: t.Uint64 = {} as unknown as t.Uint64
  export const Float32: t.Float32 = {} as unknown as t.Float32
  export const Float64: t.Float64 = {} as unknown as t.Float64
  export const Null: t.Null = {} as unknown as t.Null
  export const String: t.String = {} as unknown as t.String
  export const Error: t.Err = {} as unknown as t.Err
  export const Any: t.Any = {} as unknown as t.Any
  export const TimeStamp: t.TimeStamp = {} as unknown as t.TimeStamp
  export const Blob: t.Blob = {} as unknown as t.Blob
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

export const isDict = (type: VarType): type is t.Dict => {
  const props = Object.getOwnPropertyNames(type)
  return props.includes('keyType') && props.includes('valueType')
}

export const isTuple2 = (type: VarType): type is t.Tuple2 => {
  const props = Object.getOwnPropertyNames(type)
  return props.includes('item1') && props.includes('item2')
}
