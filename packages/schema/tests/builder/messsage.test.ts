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

import { _testing } from '../../src'
import { genMsgNames, genSourceFiles, genTestMessageFiles } from '@typerpc/test-utils'
import { Project, SourceFile } from 'ts-morph'

const { buildMessages, parseMsgProps, isOptionalProp } = _testing

let project: Project
let files: SourceFile[]
beforeEach(() => {
    project = new Project()
    files = genSourceFiles(genTestMessageFiles(genMsgNames()), project)
})

test('buildMessages() should return all messages with correct name', () => {
    for (const file of files) {
        const messages = buildMessages(file)
        for (const message of messages) {
            expect(file.getTypeAlias(message.name)).toBeTruthy()
        }
    }
})

test('buildMessages() should return all messages with correct number of properties', () => {
    for (const file of files) {
        const messages = buildMessages(file)
        for (const message of messages) {
            expect(parseMsgProps(file.getTypeAlias(message.name)!).length).toEqual(message.properties.length)
        }
    }
})

test('buildMessages() should return messages with correct isOptional value for all properties', () => {
    for (const file of files) {
        const messages = buildMessages(file)
        for (const message of messages) {
            const props = parseMsgProps(file.getTypeAlias(message.name)!)
            let i = 0
            while (i < message.properties.length) {
                expect(isOptionalProp(props[i])).toEqual(message.properties[i].isOptional)
                i++
            }
        }
    }
})
