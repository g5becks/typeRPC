import {internal as _} from '@typerpc/types'
import {make} from './make'

// A reference to a Type Alias (rpc.Msg) defined in a schema file
// and used as Type in either another rpc.Msg or a service MutationMethod parameter
// or return Type.
export type Struct = Readonly<{
  name: string;
  useCbor: boolean;
  toString(): string;
}> & { readonly brand: unique symbol }

// A Property of a structLiteral
export type StructLiteralProp = Readonly<{
  name: string;
  type: DataType;
  isOptional: boolean;
  toString(): string;
}>

// An anonymous rpc.Message
// Since all languages dont support object/class/struct literals,
// When generating code for said language,
// It is suggested to create a class/struct/object using the
// name of the owning rpc.Message + property name if used inside of an rpc.Message.
// If used as a method param, use the QueryService name + MutationMethod name + param name.
// If used as a method return, use the QueryService name + MutationMethod name + 'Result'
export type StructLiteral = Readonly<{
  properties: ReadonlyArray<StructLiteralProp>;
  toString(): string;
}>

export const structLiteralProp = (name: string, type: DataType, isOptional: boolean): StructLiteralProp => {
  return {
    name, type, isOptional, toString(): string {
      return `${name}${isOptional ? '?' : ''}: ${type.toString()};`
    },
  }
}
const builtScalars = [make.blob, make.unit, make.timestamp, make.dyn, make.err, make.str, make.nil, make.float64, make.float32, make.uint64, make.int64, make.uint32, make.int32, make.uint16, make.int16, make.uint8, make.int8, make.bool]

export const scalars = ['$.blob', '$.unit', '$.timestamp', '$.dyn', '$.err', '$.str', '$.nil', '$.float64', '$.float32', '$.uint64', '$.int64', '$.uint32', '$.int32', '$.uint16', '$.int16', '$.uint8', '$.int8', '$.bool']

export const scalarsMap = new Map<string, _.Scalar>(scalars.map((prim, i) => [prim, builtScalars[i]]))

export const containers = ['$.map', '$.tuple2', '$.tuple3', '$.tuple4', '$.tuple5', '$.list']

// types that are valid to use a query param in a get request
export const queryParamables = ['$.bool', '$.timestamp', '$.int8', '$.uint8', '$.int16', '$.uint16', '$.int32', '$.uint32', '$.uint64', '$.int64', '$.float32', '$.float64', '$.str', '$.list']

export type DataType = _.RpcType | Struct | StructLiteral
