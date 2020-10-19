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

/* eslint-disable new-cap */
import { $, internal as x } from '@typerpc/types'
import { DataType, queryParamables, scalarsMap, Struct, StructLiteral, UnionLiteral } from './data-type'

const validateType = (type: unknown, ...propNames: string[]): boolean => {
    const props = Object.getOwnPropertyNames(type).filter((prop) => !prop.includes('toString'))
    return propNames.every((name) => props.includes(name)) && props.length === propNames.length
}
// validate every TupleN type by ensuring it has itemN property names.
const validateTuple = (type: unknown, numItems: number): boolean => {
    let props: string[] = []
    let i = 0
    while (i < numItems) {
        props = props.concat(`item${i + 1}`)
        i++
    }
    return validateType(type, ...props)
}
// functions to validate the type of a variable
export const is = {
    map: (type: unknown): type is $.map<$.str, x.Paramable> => validateType(type, 'keyType', 'valType'),
    tuple2: (type: unknown): type is $.tuple2<x.Paramable, x.Paramable> => validateTuple(type, 2),
    tuple3: (type: unknown): type is $.tuple3<x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 3),
    tuple4: (type: unknown): type is $.tuple4<x.Paramable, x.Paramable, x.Paramable, x.Paramable> =>
        validateTuple(type, 4),
    tuple5: (type: unknown): type is $.tuple5<x.Paramable, x.Paramable, x.Paramable, x.Paramable, x.Paramable> =>
        validateTuple(type, 5),
    list: (type: unknown): type is $.list<x.Paramable> => validateType(type, 'dataType'),
    struct: (type: unknown): type is Struct => validateType(type, 'name', 'useCbor'),
    structLiteral: (type: unknown): type is StructLiteral => validateType(type, 'properties'),
    unionLiteral: (type: unknown): type is UnionLiteral => validateType(type, 'types'),
    container: (type: unknown): boolean =>
        [
            is.struct,
            is.list,
            is.map,
            is.tuple2,
            is.tuple3,
            is.tuple4,
            is.tuple3,
            is.tuple5,
            is.structLiteral,
            is.unionLiteral,
        ].some((func) => func(type)),
    queryParamable: (type: DataType): boolean => queryParamables.some((param) => type.toString().startsWith(param)),
    scalar: (type: any): type is x.Scalar => !is.container(type) && scalarsMap.has(type.toString()),
    dataType: (type: any): type is DataType => is.container(type) || is.scalar(type),
}
