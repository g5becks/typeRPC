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
import { MethodSignature, Node, TypeAliasDeclaration, TypeNode } from 'ts-morph'
import { DataType, make, typeError } from '../index'
import { parseJsDocComment } from '../parser'
import { isContainer, isMsgLiteral, isValidDataType } from '../validator'
import { isUnionLiteral } from '../validator/utils'

export const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

export const makeDataType = (type: TypeNode | Node): DataType => {
    if (!isValidDataType(type)) {
        throw typeError(type)
    }
    const prim = make.scalar(type)
    if (prim) {
        return prim
    }
    if (isMsgLiteral(type)) {
        return make.structLiteral(type, makeDataType)
    }
    if (isUnionLiteral(type)) {
        return make.unionLiteral(type, makeDataType)
    }
    if (!isContainer(type)) {
        return make.struct(type)
    }
    if (isType(type, '$.list')) {
        return make.list(type, makeDataType)
    }
    if (isType(type, '$.map')) {
        return make.map(type, makeDataType)
    }
    if (isType(type, '$.tuple')) {
        return make.tuple(type, makeDataType)
    }

    return make.dyn
}

// Determines if the generated type or method should use cbor for serialization/deserialization
// based on the JsDoc @kind tag
export const useCbor = (type: TypeAliasDeclaration | MethodSignature | undefined): boolean => {
    if (typeof type === 'undefined') {
        return false
    }
    const comment = parseJsDocComment(type, 'kind')?.trim()?.toLowerCase() ?? ''
    return comment.includes('cbor')
}
