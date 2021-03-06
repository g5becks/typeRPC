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

import { MethodSignature, Node, ParameterDeclaration, SourceFile, TypeAliasDeclaration, TypeNode } from 'ts-morph'
import {
    DataType,
    HTTPErrCode,
    HTTPResponseCode,
    Import,
    Message,
    Method,
    MutationMethod,
    Param,
    QueryMethod,
    Schema,
} from '../index'
import { isType, makeDataType, useCbor } from './data-type'
import { buildMessages } from './message'
import {
    buildErrCode,
    buildMethod,
    buildMutationMethod,
    buildMutationServices,
    buildParams,
    buildQueryMethod,
    buildQueryServices,
    buildResponseCode,
    hasCborParams,
} from './service'
import { buildUnions } from './union'

export { useCbor }
const buildImports = (file: SourceFile): ReadonlyArray<Import> =>
    file
        .getImportDeclarations()
        .filter((imp) => imp.getModuleSpecifierValue() !== '@typerpc/types')
        .map((imp) => {
            return {
                messageNames: imp.getNamedImports().map((name) => name.getName()),
                fileName: imp.getModuleSpecifierValue().replace('./', ''),
            }
        })

const buildSchema = (file: SourceFile, packageName: string): Schema => {
    return {
        packageName,
        imports: buildImports(file),
        fileName: file.getBaseNameWithoutExtension(),
        messages: buildMessages(file),
        queryServices: buildQueryServices(file),
        unions: buildUnions(file),
        mutationServices: buildMutationServices(file),
        get hasCbor(): boolean {
            return (
                this.mutationServices
                    .flatMap((svc) => [...svc.methods])
                    .some((method) => method.hasCborParams || method.hasCborReturn) ||
                this.queryServices.flatMap((svc) => [...svc.methods]).some((method) => method.hasCborReturn)
            )
        },
    }
}
export const buildSchemas = (sourceFiles: SourceFile[], packageName: string): Schema[] => [
    ...new Set<Schema>(sourceFiles.map((file) => buildSchema(file, packageName))),
]

export const internalTesting: {
    buildResponseCode: (method: MethodSignature) => HTTPResponseCode
    buildImports: (file: SourceFile) => ReadonlyArray<Import>
    makeDataType: (type: TypeNode | Node) => DataType
    buildMethod: (method: MethodSignature, isCborSvc: boolean) => Method
    hasCborParams: (params: ReadonlyArray<Param>, method: MethodSignature, isCborSvc: boolean) => boolean
    buildQueryMethod: (method: MethodSignature, isCborSvc: boolean) => QueryMethod
    useCbor: (type: TypeAliasDeclaration | MethodSignature | undefined) => boolean
    isType: (type: TypeNode | Node, typeText: string) => boolean
    buildSchema: (file: SourceFile, packageName: string) => Schema
    buildErrCode: (method: MethodSignature) => HTTPErrCode
    buildMessages: (file: SourceFile) => Message[]
    buildParams: (params: ParameterDeclaration[]) => Param[]
    buildMutationMethod: (method: MethodSignature, isCborSvc: boolean) => MutationMethod
} = {
    useCbor,
    isType,
    buildSchema,
    buildParams,
    buildMessages,
    buildErrCode,
    buildResponseCode,
    makeDataType,
    buildMutationMethod,
    buildMethod,
    buildQueryMethod,
    hasCborParams,
    buildImports,
}
