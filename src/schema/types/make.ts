import {Node, PropertySignature, TypeNode} from 'ts-morph'
import {DataType, scalarsMap, Struct, structLiteralProp, StructLiteralProp} from './data-type'
import {isOptionalProp, parseMsgProps, parseTypeParams} from '../parser'
import {useCbor} from '../builder/data-type'
import {isValidMsg} from '../validator'

export const typeError = (type: TypeNode | Node) => new TypeError(`error in file ${type.getSourceFile().getFilePath()}
    at line number: ${type.getStartLineNumber()}
    message: ${type.getText()} is neither a valid typerpc DataType or rpc.Msg that was imported or defined in this file.`)

const makeStructLiteralProps = (props: PropertySignature[], makeDataType: (type: TypeNode | Node) => DataType): StructLiteralProp[] =>
  props.map(prop => structLiteralProp(prop.getName(), makeDataType(prop.getTypeNodeOrThrow()),
    isOptionalProp(prop)))
export const make = {
  Struct: (type: Node | TypeNode): Struct => {
    // get the text of the Type field
    const name = type.getText()?.trim()
    const alias = type.getSourceFile().getTypeAlias(name)
    if (!isValidMsg(type)) {
      throw typeError(type)
    }
    return {
      name: type.getText()?.trim(), useCbor: useCbor(alias), toString() {
        return this.name
      },
    } as Struct
  },

  StructLiteral: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
    const properties = makeStructLiteralProps(parseMsgProps(type), makeDataType)
    return {
      properties, toString(): string {
        return `{${properties.map(prop => prop.toString())}}`
      },
    }
  },
  Dict: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
    const params = parseTypeParams(type)
    const key = make.primitive(params[0])
    const val = makeDataType(params[1])
    if (!key) {
      throw typeError(type)
    }
    return {
      key, val, toString() {
        return `$.Dict<${key.toString()}, ${val.toString()}>`
      },
    } as unknown as DataType
  },
  Tuple: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
    const params = parseTypeParams(type)
    const item1 = makeDataType(params[0])
    const item2 = makeDataType(params[1])
    switch (params.length) {
    case 2:
      return {
        item1, item2, toString() {
          return `$.Tuple2<${item1.toString()}, ${item2.toString()}>`
        },
      } as unknown as DataType

    case 3: {
      const item3 = makeDataType(params[2])
      return {
        item1, item2, item3, toString() {
          return `$.Tuple3<${item1.toString()}, ${item2.toString()}, ${item3.toString()}>`
        },
      } as unknown as DataType
    }
    case 4: {
      const item3 = makeDataType(params[2])
      const item4 = makeDataType(params[3])
      return {
        item1, item2, item3, item4, toString() {
          return `$.Tuple4<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}>`
        },
      } as unknown as DataType
    }
    case 5: {
      const item3 = makeDataType(params[2])
      const item4 = makeDataType(params[3])
      const item5 = makeDataType(params[4])
      return {
        item1, item2, item3, item4, item5, toString() {
          return `$.Tuple5<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}, ${item5.toString()}>`
        },
      } as unknown as DataType
    }

    default:
      throw typeError(type)
    }
  },

  List: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
    const dataType = makeDataType(parseTypeParams(type)[0])
    return {
      dataType, toString() {
        return `$.List<${dataType.toString()}>`
      },
    } as unknown as DataType
  },
  primitive: (type: TypeNode | Node): DataType | undefined => scalarsMap.get(type.getText().trim()),
  get bool(): DataType {
    return {toString: () => '$.bool'} as DataType
  },
  get int8(): DataType {
    return {toString: () => '$.int8'} as DataType
  },
  get uint8(): DataType {
    return {toString: () => '$.uint8'} as DataType
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
}
