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
import { make } from './make'

// A reference to a Type Alias (rpc.Msg) defined in a schema file
// and used as Type in either another rpc.Msg or a service MutationMethod parameter
// or return Type.
export type Struct = Readonly<{
    name: string
    useCbor: boolean
    toString(): string
}> & { readonly brand: unique symbol }

// A Property of a structLiteral
export type StructLiteralProp = Readonly<{
    name: string
    type: DataType
    isOptional: boolean
    toString(): string
}>

// An anonymous rpc.Message
// Since all languages dont support object/class/struct literals,
// When generating code for said language,
// It is suggested to create a class/struct/object using the
// location of the owning rpc.Message + property location if used inside of an rpc.Message.
// If used as a method param, use the QueryService location + MutationMethod location + param location.
// If used as a method return, use the QueryService location + MutationMethod location + 'Result'
export type StructLiteral = Readonly<{
    properties: ReadonlyArray<StructLiteralProp>
    toString(): string
}>

export const structLiteralProp = (name: string, type: DataType, isOptional: boolean): StructLiteralProp => {
    return {
        name,
        type,
        isOptional,
        toString(): string {
            return `${name}${isOptional ? '?' : ''}: ${type.toString()};`
        },
    }
}
const builtScalars = [
    make.blob,
    make.unit,
    make.timestamp,
    make.dyn,
    make.str,
    make.nil,
    make.float64,
    make.float32,
    make.uint64,
    make.int64,
    make.uint32,
    make.int32,
    make.uint16,
    make.int16,
    make.uint8,
    make.int8,
    make.bool,
]

export const scalars = [
    '$.blob',
    '$.unit',
    '$.timestamp',
    '$.dyn',
    '$.str',
    '$.nil',
    '$.float64',
    '$.float32',
    '$.uint64',
    '$.int64',
    '$.uint32',
    '$.int32',
    '$.uint16',
    '$.int16',
    '$.uint8',
    '$.int8',
    '$.bool',
]

export const scalarsMap = new Map<string, _.Scalar>(scalars.map((prim, i) => [prim, builtScalars[i]]))

export const containers = ['$.map', '$.tuple2', '$.tuple3', '$.tuple4', '$.tuple5', '$.list']

// types that are valid to use a query param in a get request
export const queryParamables = [
    '$.bool',
    '$.timestamp',
    '$.int8',
    '$.uint8',
    '$.int16',
    '$.uint16',
    '$.int32',
    '$.uint32',
    '$.uint64',
    '$.int64',
    '$.float32',
    '$.float64',
    '$.str',
    '$.list',
]

export type DataType = _.RpcType | Struct | StructLiteral
