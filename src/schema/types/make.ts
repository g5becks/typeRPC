import {Node, PropertySignature, TypeNode} from 'ts-morph'
import {DataType, scalarsMap, Struct, structLiteralProp, StructLiteralProp} from './data-type'
import {isOptionalProp, parseMsgProps, parseTypeParams} from '../parser'
import {useCbor} from '../builder'
import {isValidMsg} from '../validator'
import {internal as _} from '@typerpc/types'
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
  scalar: (type: TypeNode | Node): _.Scalar | undefined => scalarsMap.get(type.getText().trim()),
  get bool(): _.Scalar {
    return {type: 'bool', toString: () => '$.bool'} as unknown as _.Scalar
  },
  get int8(): _.Scalar {
    return {type: 'int8', toString: () => '$.int8'} as unknown as _.Scalar
  },
  get uint8(): _.Scalar {
    return {type: 'uint8', toString: () => '$.uint8'} as unknown as _.Scalar
  },
  get int16(): _.Scalar {
    return {type: 'int16', toString: () => '$.int16'} as unknown as _.Scalar
  },
  get uint16(): _.Scalar {
    return {type: 'uint16', toString: () => '$.uint16'} as unknown as _.Scalar
  },
  get int32(): _.Scalar {
    return {type: 'int32', toString: () => '$.int32'} as unknown as _.Scalar
  },
  get uint32(): _.Scalar {
    return {type: 'uint32', toString: () => '$.uint32'} as unknown as _.Scalar
  },
  get int64(): _.Scalar {
    return {type: 'int64', toString: () => '$.int64'} as unknown as _.Scalar
  },
  get uint64(): _.Scalar {
    return {type: 'uint64', toString: () => '$.uint64'} as unknown as _.Scalar
  },
  get float32(): _.Scalar {
    return {type: 'float32', toString: () => '$.float32'} as unknown as _.Scalar
  },
  get float64(): _.Scalar {
    return {type: 'float64', toString: () => '$.float64'} as unknown as _.Scalar
  },
  get nil(): _.Scalar {
    return {type: 'nil', toString: () => '$.nil'} as unknown as _.Scalar
  },
  get str(): _.Scalar {
    return {type: 'str', toString: () => '$.str'} as unknown as _.Scalar
  },
  get err(): _.Scalar {
    return {type: 'err', toString: () => '$.err'} as unknown as _.Scalar
  },
  get dyn(): _.Scalar {
    return {type: 'dyn', toString: () => '$.dyn'} as unknown as _.Scalar
  },
  get timestamp(): _.Scalar {
    return {type: 'timestamp', toString: () => '$.timestamp'} as unknown as _.Scalar
  },
  get unit(): _.Scalar {
    return {type: 'unit', toString: () => '$.unit'} as unknown as _.Scalar
  },
  get blob(): _.Scalar {
    return {type: 'blob', toString: () => '$.blob'} as unknown as _.Scalar
  },
}
