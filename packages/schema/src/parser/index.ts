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

import {
    MethodSignature,
    Node,
    PropertySignature,
    SourceFile,
    SyntaxKind,
    TypeAliasDeclaration,
    TypeNode,
    TypeReferenceNode,
} from 'ts-morph'
import ts from 'typescript'
import { isMsg, isMsgLiteral, isMutationSvc, isQuerySvc } from '../validator'
import { isUnion, isUnionLiteral } from '../validator/utils'

const isTypeAlias = (type: any): type is TypeAliasDeclaration => 'getName' in type
const isTypeNode = (type: any): type is TypeNode => !('getName' in type)

// is the type property optional?
export const isOptionalProp = (prop: PropertySignature): boolean => typeof prop.getQuestionTokenNode() !== 'undefined'

// parse all of the properties location an rpc.Msg Type alias for rpc.Msg literal
export const parseMsgProps = (type: TypeAliasDeclaration | TypeNode | Node): PropertySignature[] => {
    let kids: PropertySignature[] = []
    if (isTypeAlias(type)) {
        kids = type
            .getTypeNodeOrThrow()
            .getChildrenOfKind(SyntaxKind.TypeLiteral)[0]
            .getChildrenOfKind(SyntaxKind.PropertySignature)
    }
    if (isTypeNode(type) && isMsgLiteral(type)) {
        kids = type.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.PropertySignature)
    }
    return kids
}

// parses all of the named imports for a file
export const parseNamedImports = (file: SourceFile): string[] =>
    file
        .getImportDeclarations()
        .flatMap((imp) => imp.getNamedImports())
        .flatMap((imp) => imp.getName())

// returns the type parameters portion of the type as an array
export const parseTypeParams = (type: Node | TypeNode): TypeReferenceNode[] =>
    type.getChildrenOfKind(SyntaxKind.TypeReference)

// gets the comment portion of a JsDoc comment base on the tagName
export const parseJsDocComment = (
    method: MethodSignature | TypeAliasDeclaration,
    tagName: string,
): string | undefined => {
    const tags = method.getJsDocs()[0]?.getTags()
    return tags
        ?.filter((tag) => tag.getTagName() === tagName)[0]
        ?.getComment()
        ?.trim()
}

// get all nodes of a union type
export const parseUnionTypes = (type: TypeAliasDeclaration | TypeNode | Node): Node<ts.Node>[] => {
    let types: Node<ts.Node>[] = []
    if (isTypeAlias(type)) {
        types = type.getTypeNodeOrThrow().getChildrenOfKind(SyntaxKind.TupleType)[0].forEachChildAsArray()
    }
    if (isTypeNode(type) && isUnionLiteral(type)) {
        types = type.getChildrenOfKind(SyntaxKind.TupleType)[0].forEachChildAsArray()
    }
    return types
}

// parses all message declarations location a schema file
export const parseMessages = (file: SourceFile): TypeAliasDeclaration[] =>
    file.getTypeAliases().filter((alias) => isMsg(alias))

export const parseUnions = (file: SourceFile): TypeAliasDeclaration[] =>
    file.getTypeAliases().filter((alias) => isUnion(alias))

// parses all rpc.QuerySvc declarations location a schema file
export const parseQueryServices = (file: SourceFile): TypeAliasDeclaration[] =>
    file.getTypeAliases().filter((alias) => isQuerySvc(alias))

// parses all rpc.MutationSvc declarations location a schema file
export const parseMutationServices = (file: SourceFile): TypeAliasDeclaration[] =>
    file.getTypeAliases().filter((alias) => isMutationSvc(alias))

// parse all of the methods location an rpc.QueryService type alias
export const parseServiceMethods = (type: TypeAliasDeclaration): MethodSignature[] =>
    type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.MethodSignature)
