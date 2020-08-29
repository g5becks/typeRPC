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
    const keyType = make.scalar(params[0])
    const valType = makeDataType(params[1])
    if (!keyType) {
      throw typeError(type)
    }
    return {
      keyType, valType, toString() {
        return `$.Dict<${keyType.toString()}, ${valType.toString()}>`
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
  scalar: (type: TypeNode | Node): DataType | undefined => scalarsMap.get(type.getText().trim()),
  get bool(): DataType {
    return {type: 'bool', toString: () => '$.bool'} as unknown as DataType
  },
  get int8(): DataType {
    return {type: 'int8', toString: () => '$.int8'} as unknown as DataType
  },
  get uint8(): DataType {
    return {type: 'uint8', toString: () => '$.uint8'} as unknown as DataType
  },
  get int16(): DataType {
    return {type: 'int16', toString: () => '$.int16'} as unknown as DataType
  },
  get uint16(): DataType {
    return {type: 'uint16', toString: () => '$.uint16'} as unknown as DataType
  },
  get int32(): DataType {
    return {type: 'int32', toString: () => '$.int32'} as unknown as DataType
  },
  get uint32(): DataType {
    return {type: 'uint32', toString: () => '$.uint32'} as unknown as DataType
  },
  get int64(): DataType {
    return {type: 'int64', toString: () => '$.int64'} as unknown as DataType
  },
  get uint64(): DataType {
    return {type: 'uint64', toString: () => '$.uint64'} as unknown as DataType
  },
  get float32(): DataType {
    return {type: 'float32', toString: () => '$.float32'} as unknown as DataType
  },
  get float64(): DataType {
    return {type: 'float64', toString: () => '$.float64'} as unknown as DataType
  },
  get nil(): DataType {
    return {type: 'nil', toString: () => '$.nil'} as unknown as DataType
  },
  get str(): DataType {
    return {type: 'str', toString: () => '$.str'} as unknown as DataType
  },
  get err(): DataType {
    return {type: 'err', toString: () => '$.err'} as unknown as DataType
  },
  get dyn(): DataType {
    return {type: 'dyn', toString: () => '$.dyn'} as unknown as DataType
  },
  get timestamp(): DataType {
    return {type: 'timestamp', toString: () => '$.timestamp'} as unknown as DataType
  },
  get unit(): DataType {
    return {type: 'unit', toString: () => '$.unit'} as unknown as DataType
  },
  get blob(): DataType {
    return {type: 'blob', toString: () => '$.blob'} as unknown as DataType
  },
}
