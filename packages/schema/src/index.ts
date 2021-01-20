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

import { buildSchemas, internalTesting } from './builder'
import {
    containers,
    DataType,
    queryParamables,
    scalars,
    StringLiteral,
    Struct,
    StructLiteral,
    StructLiteralProp,
    UnionLiteral,
} from './data-type'
import { is } from './is'
import { make, typeError } from './make'
import {
    isOptionalProp,
    parseMessages,
    parseMsgProps,
    parseMutationServices,
    parseQueryServices,
    parseServiceMethods,
} from './parser'
import {
    HTTPErrCode,
    HTTPResponseCode,
    Import,
    isMutationMethod,
    isMutationSvc,
    isQueryMethod,
    isQuerySvc,
    Message,
    Method,
    MutationMethod,
    MutationService,
    Param,
    Property,
    QueryMethod,
    QueryService,
    Schema,
    Union,
} from './schema'
import { internal, validateSchemas } from './validator'
import {
    MethodSignature,
    Node,
    ParameterDeclaration,
    PropertySignature,
    SourceFile,
    TypeAliasDeclaration,
    TypeNode,
} from 'ts-morph'

export {
    StringLiteral,
    UnionLiteral,
    Union,
    buildSchemas,
    validateSchemas,
    Import,
    isMutationSvc,
    isMutationMethod,
    isQueryMethod,
    isQuerySvc,
    Message,
    Method,
    MutationMethod,
    MutationService,
    Param,
    Property,
    HTTPResponseCode,
    HTTPErrCode,
    QueryService,
    QueryMethod,
    Schema,
    DataType,
    make,
    is,
    typeError,
    StructLiteral,
    Struct,
    StructLiteralProp,
    queryParamables,
    scalars,
    containers,
}

export const _testing: {
    hasCborParams: (params: ReadonlyArray<Param>, method: MethodSignature, isCborSvc: boolean) => boolean
    buildQueryMethod: (method: MethodSignature, isCborSvc: boolean) => QueryMethod
    useCbor: (type: TypeAliasDeclaration | MethodSignature | undefined) => boolean
    buildSchema: (file: SourceFile, packageName: string) => Schema
    validateExports: (file: SourceFile) => Error[]
    validateNotGeneric: (type: TypeAliasDeclaration | MethodSignature) => Error[]
    isValidDataType: (type: TypeNode | Node | undefined) => boolean
    buildErrCode: (method: MethodSignature) => HTTPErrCode
    validateMessages: (file: SourceFile) => Error[]
    validateEnums: (file: SourceFile) => Error[]
    isOptionalProp: (prop: PropertySignature) => boolean
    parseServiceMethods: (type: TypeAliasDeclaration) => MethodSignature[]
    parseMessages: (file: SourceFile) => TypeAliasDeclaration[]
    validateMethodJsDoc: (method: MethodSignature) => Error[]
    buildMutationMethod: (method: MethodSignature, isCborSvc: boolean) => MutationMethod
    validateClasses: (file: SourceFile) => Error[]
    buildResponseCode: (method: MethodSignature) => HTTPResponseCode
    buildImports: (file: SourceFile) => ReadonlyArray<Import>
    validateImports: (file: SourceFile, projectFiles: SourceFile[]) => Error[]
    parseQueryServices: (file: SourceFile) => TypeAliasDeclaration[]
    validateTypes: (file: SourceFile) => Error[]
    validateFunctions: (file: SourceFile) => Error[]
    validateMessage: (msg: TypeAliasDeclaration | TypeNode) => Error[]
    makeDataType: (type: TypeNode | Node) => DataType
    buildMethod: (method: MethodSignature, isCborSvc: boolean) => Method
    validateJsDoc: (type: TypeAliasDeclaration) => Error[]
    validateReturnType: (method: MethodSignature) => Error[]
    parseMutationServices: (file: SourceFile) => TypeAliasDeclaration[]
    isType: (type: TypeNode | Node, typeText: string) => boolean
    validateNameSpaces: (file: SourceFile) => Error[]
    isValidMsg: (type: TypeNode | Node) => boolean
    validateService: (service: TypeAliasDeclaration) => Error[]
    buildMessages: (file: SourceFile) => Message[]
    buildParams: (params: ParameterDeclaration[]) => Param[]
    validateQueryMethodParams: (method: MethodSignature) => Error[]
    validateVariables: (file: SourceFile) => Error[]
    parseMsgProps: (type: TypeAliasDeclaration | TypeNode | Node) => PropertySignature[]
    isScalar: (type: TypeNode | Node) => boolean
    validateStatements: (file: SourceFile) => Error[]
    validateInterfaces: (file: SourceFile) => Error[]
} = {
    ...internalTesting,
    ...internal,
    parseMsgProps,
    parseMessages,
    parseMutationServices,
    parseQueryServices,
    isOptionalProp,
    parseServiceMethods,
}
