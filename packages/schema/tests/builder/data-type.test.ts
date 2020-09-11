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

import { _testing, containers, is, scalars } from '../../src'
import { Project, TypeAliasDeclaration } from 'ts-morph'
import {
    genMsgNames,
    genSourceFile,
    genSourceFiles,
    genTestMessageFiles,
    makeStructTestSource,
} from '@typerpc/test-utils'

const { isType, useCbor, makeDataType, parseMsgProps } = _testing

let project: Project
beforeEach(() => {
    project = new Project()
})

test('isType() should return true when given the proper type', () => {
    let vars = ''
    const types = [...scalars, ...containers]
    for (const type of scalars) {
        vars = vars.concat(`var ${type.replace('$.', '')}: ${type}\n`)
    }
    for (const type of containers) {
        vars = vars.concat(`var ${type.replace('$.', '')}: ${type}\n`)
    }
    genSourceFile(vars, project)
        .getVariableDeclarations()
        .forEach((variable, i) => expect(isType(variable.getTypeNode()!, types[i])).toBeTruthy())
})

test('makeDataType() should return correct dataType for type prop', () => {
    const sources = genSourceFiles(genTestMessageFiles(genMsgNames()), project)
    const types: TypeAliasDeclaration[] = sources.flatMap((source) => source.getTypeAliases())
    const propTypes = types.flatMap((type) => parseMsgProps(type)).flatMap((prop) => prop.getTypeNodeOrThrow())
    for (const type of propTypes) {
        expect(is.dataType(makeDataType(type))).toBeTruthy()
    }
})

test('useCbor() should return the correct boolean value based on JsDoc tag', () => {
    const file = genSourceFile(makeStructTestSource, project)
    const cbor1 = file.getTypeAlias('CborType')
    const cbor2 = file.getTypeAlias('AnotherCbor')
    const noCbor1 = file.getTypeAlias('NoCbor')
    const noCbor2 = file.getTypeAlias('MoreNoCbor')

    expect(useCbor(cbor1)).toBeTruthy()
    expect(useCbor(cbor2)).toBeTruthy()
    expect(useCbor(noCbor1)).toBeFalsy()
    expect(useCbor(noCbor2)).toBeFalsy()
})
