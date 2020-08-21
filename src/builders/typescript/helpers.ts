/* eslint-disable new-cap */
import {DataType, is, primitives} from '../../schema/types'

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
