/* eslint-disable new-cap */
import { MethodSignature, Node, TypeAliasDeclaration, TypeNode } from 'ts-morph'
import { DataType, make, typeError } from '@typerpc/schema'
import { isContainer, isMsgLiteral, isValidDataType } from '@typerpc/validators'
import { parseJsDocComment } from '../../parser/lib/parser'

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
    const comment = parseJsDocComment(type, 'kind')?.trim().toLowerCase() ?? ''
    return comment.includes('cbor')
}
