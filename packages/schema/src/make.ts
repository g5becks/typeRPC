/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { internal as _ } from '@typerpc/types'
import { Node, PropertySignature, TypeNode } from 'ts-morph'
import { useCbor } from './builder'
import { DataType, scalarsMap, Struct, structLiteralProp, StructLiteralProp } from './data-type'
import { isOptionalProp, parseMsgProps, parseTypeParams } from './parser'
import { parseUnionTypes } from './parser/index'
import { isValidMsg } from './validator'

export const typeError = (type: TypeNode | Node): TypeError =>
    new TypeError(`error in file ${type.getSourceFile().getFilePath()}
    at line number: ${type.getStartLineNumber()}
    message: ${type.getText()} is neither a valid typerpc DataType or rpc.Msg that was imported or defined in this file.`)

const makeStructLiteralProps = (
    props: PropertySignature[],
    makeDataType: (type: TypeNode | Node) => DataType,
): StructLiteralProp[] =>
    props.map((prop) =>
        structLiteralProp(prop.getName(), makeDataType(prop.getTypeNodeOrThrow()), isOptionalProp(prop)),
    )
export const make = {
    struct: (type: Node | TypeNode): Struct => {
        // get the text of the Type field
        const name = type.getText()?.trim()
        const alias = type.getSourceFile().getTypeAlias(name)
        if (!isValidMsg(type)) {
            throw typeError(type)
        }
        return {
            name: type.getText()?.trim(),
            useCbor: useCbor(alias),
            toString() {
                return this.name
            },
        } as Struct
    },

    structLiteral: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
        const properties = makeStructLiteralProps(parseMsgProps(type), makeDataType)
        return {
            properties,
            toString(): string {
                let props = ''
                for (const prop of properties) {
                    props = props.concat(prop + '\n')
                }
                return `rpc.Msg<{${props}}>`
            },
        }
    },

    unionLiteral: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
        const types = parseUnionTypes(type).map((t) => makeDataType(t))
        return {
            types,
            toString(): string {
                let opts = ''
                for (const t of types) {
                    opts = opts.concat(t.toString() + '\n')
                }
                return `rpc.Union<[${opts}]>`
            },
        }
    },

    stringLiteral: (type: TypeNode | Node): DataType => {
        return { value: type.getText().trim() }
    },

    map: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
        const params = parseTypeParams(type)
        const keyType = make.scalar(params[0])
        const valType = makeDataType(params[1])
        if (!keyType) {
            throw typeError(type)
        }
        return ({
            keyType,
            valType,
            toString() {
                return `$.map<${keyType.toString()}, ${valType.toString()}>`
            },
        } as unknown) as DataType
    },
    tuple: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
        const params = parseTypeParams(type)
        const item1 = makeDataType(params[0])
        const item2 = makeDataType(params[1])
        switch (params.length) {
            case 2:
                return ({
                    item1,
                    item2,
                    toString() {
                        return `$.tuple2<${item1.toString()}, ${item2.toString()}>`
                    },
                } as unknown) as DataType

            case 3: {
                const item3 = makeDataType(params[2])
                return ({
                    item1,
                    item2,
                    item3,
                    toString() {
                        return `$.tuple3<${item1.toString()}, ${item2.toString()}, ${item3.toString()}>`
                    },
                } as unknown) as DataType
            }
            case 4: {
                const item3 = makeDataType(params[2])
                const item4 = makeDataType(params[3])
                return ({
                    item1,
                    item2,
                    item3,
                    item4,
                    toString() {
                        return `$.tuple4<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}>`
                    },
                } as unknown) as DataType
            }
            case 5: {
                const item3 = makeDataType(params[2])
                const item4 = makeDataType(params[3])
                const item5 = makeDataType(params[4])
                return ({
                    item1,
                    item2,
                    item3,
                    item4,
                    item5,
                    toString() {
                        return `$.tuple5<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}, ${item5.toString()}>`
                    },
                } as unknown) as DataType
            }

            default:
                throw typeError(type)
        }
    },

    list: (type: TypeNode | Node, makeDataType: (type: TypeNode | Node) => DataType): DataType => {
        const dataType = makeDataType(parseTypeParams(type)[0])
        return ({
            dataType,
            toString() {
                return `$.list<${dataType.toString()}>`
            },
        } as unknown) as DataType
    },
    scalar: (type: TypeNode | Node): _.Scalar | undefined => scalarsMap.get(type.getText().trim()),
    get bool(): _.Scalar {
        return ({ type: 'bool', toString: () => '$.bool' } as unknown) as _.Scalar
    },
    get int8(): _.Scalar {
        return ({ type: 'int8', toString: () => '$.int8' } as unknown) as _.Scalar
    },
    get uint8(): _.Scalar {
        return ({ type: 'uint8', toString: () => '$.uint8' } as unknown) as _.Scalar
    },
    get int16(): _.Scalar {
        return ({ type: 'int16', toString: () => '$.int16' } as unknown) as _.Scalar
    },
    get uint16(): _.Scalar {
        return ({ type: 'uint16', toString: () => '$.uint16' } as unknown) as _.Scalar
    },
    get int32(): _.Scalar {
        return ({ type: 'int32', toString: () => '$.int32' } as unknown) as _.Scalar
    },
    get uint32(): _.Scalar {
        return ({ type: 'uint32', toString: () => '$.uint32' } as unknown) as _.Scalar
    },
    get int64(): _.Scalar {
        return ({ type: 'int64', toString: () => '$.int64' } as unknown) as _.Scalar
    },
    get uint64(): _.Scalar {
        return ({ type: 'uint64', toString: () => '$.uint64' } as unknown) as _.Scalar
    },
    get float32(): _.Scalar {
        return ({ type: 'float32', toString: () => '$.float32' } as unknown) as _.Scalar
    },
    get float64(): _.Scalar {
        return ({ type: 'float64', toString: () => '$.float64' } as unknown) as _.Scalar
    },
    get nil(): _.Scalar {
        return ({ type: 'nil', toString: () => '$.nil' } as unknown) as _.Scalar
    },
    get str(): _.Scalar {
        return ({ type: 'str', toString: () => '$.str' } as unknown) as _.Scalar
    },
    get dyn(): _.Scalar {
        return ({ type: 'dyn', toString: () => '$.dyn' } as unknown) as _.Scalar
    },
    get timestamp(): _.Scalar {
        return ({ type: 'timestamp', toString: () => '$.timestamp' } as unknown) as _.Scalar
    },
    get unit(): _.Scalar {
        return ({ type: 'unit', toString: () => '$.unit' } as unknown) as _.Scalar
    },
    get blob(): _.Scalar {
        return ({ type: 'blob', toString: () => '$.blob' } as unknown) as _.Scalar
    },
}
