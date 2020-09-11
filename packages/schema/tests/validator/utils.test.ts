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

import { Project } from 'ts-morph'
import { _testing } from '../../src'
import { genSourceFile, isValidDataTypeTestSource } from '@typerpc/test-utils'

let project: Project
beforeEach(() => {
    project = new Project()
})

const { isValidMsg, isValidDataType, isScalar, parseMsgProps } = _testing

test('isValidDataType() should return the correct boolean value', () => {
    const props = parseMsgProps(genSourceFile(isValidDataTypeTestSource, project).getTypeAlias('SomeSvc')!)
    const types = props.map((prop) => prop.getTypeNodeOrThrow())
    let i = 0
    while (i < types.length) {
        const expected = i % 2 !== 0
        expect(isValidDataType(types[i])).toBe(expected)
        i++
    }
})

test('isValidMsg() should return false when rpc.Msg type is not imported or true otherwise', () => {
    const source = `
  import {Name} from './util'

  type SomeType = rpc.Msg<{
    name: Name
  }>

  type SomeType2 = rpc.Msg<{
    name: Kid
  }>
  `
    const types = genSourceFile(source, project).getTypeAliases()
    const msg1 = parseMsgProps(types[0])[0].getTypeNodeOrThrow()
    const msg2 = parseMsgProps(types[1])[0].getTypeNodeOrThrow()
    expect(isValidMsg(msg1)).toBeTruthy()
    expect(isValidMsg(msg2)).toBeFalsy()
})

test('isScalar() should return true when given a scalar type false otherwise', () => {
    const source = `
  type SomeType = rpc.Msg<{
    names: $.List<$.int8>
    ages: $.int8
    other: $.Dict<$.int8, $.bool>
    smooth: $.str
    }>`
    const type = genSourceFile(source, project).getTypeAliasOrThrow('SomeType')
    const props = parseMsgProps(type)
    expect(isScalar(props[0].getTypeNodeOrThrow())).toBeFalsy()
    expect(isScalar(props[1].getTypeNodeOrThrow())).toBeTruthy()
    expect(isScalar(props[2].getTypeNodeOrThrow())).toBeFalsy()
    expect(isScalar(props[3].getTypeNodeOrThrow())).toBeTruthy()
})
