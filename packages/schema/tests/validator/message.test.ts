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
import { genMsgNames, genSourceFile, genSourceFiles, genTestMessageFiles } from '../../../test-utils/src'
import { testing } from '../../../src/schema'

const { validateMessages, validateMessage } = testing
let project: Project
beforeEach(() => {
    project = new Project()
})

test('validateMessages() should not return an error when given a valid message', () => {
    const files = genSourceFiles(genTestMessageFiles(genMsgNames()), project)
    for (const file of files) {
        expect(validateMessages(file).length).toEqual(0)
    }
})

test('validateMessage() should not return an error when message has nested rpc.Msg literal', () => {
    const source = `
  type MyMsg = rpc.Msg<{
    names: rpc.Msg<{
      people: rpc.Msg<{
        moreNames: $.list<rpc.Msg<{names: $.list<$.str>}>>
      }>
      }>
    }>`
    const type = genSourceFile(source, project).getTypeAlias('MyMsg')!
    expect(validateMessage(type).length).toEqual(0)
})

test('validateMessage() should return an error when message has non typerpc data type', () => {
    const source = `
  type TestMsg = rpc.Msg<{
    name: $.str
    numbers: number[]
    }>`
    const type = genSourceFile(source, project).getTypeAlias('TestMsg')!
    expect(validateMessage(type).length).toEqual(1)
})
