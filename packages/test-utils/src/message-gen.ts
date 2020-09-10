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

import { genRandomDataType, genRandomName, randomNumber } from './data-gen'
import { genImports, optional, useCbor } from './index'

export const genRpcMsgLiteral = (msgNames: string[]): string => {
    let props = ''
    const propCount = randomNumber(5, 12)
    for (let i = 0; i < propCount; i++) {
        props = props.concat(`prop${i}${optional()}: ${genRandomDataType(msgNames)};\n`)
    }
    return `rpc.Msg<{${props}}>`
}
const genRpcMsg = (name: string, msgNames: string[]): string => `
  ${useCbor()}
  type ${name} = ${genRpcMsgLiteral(msgNames)}
  `

export const genRpcMessages = (names: string[], msgNames: string[]): string => {
    let types = ''
    for (const name of names) {
        types = types.concat(genRpcMsg(name, msgNames))
    }
    return types
}

export const genMsgNames = (): string[] => {
    const num = randomNumber(30, 50)
    let names: string[] = []
    for (let i = 0; i < num; i++) {
        names = names.concat(genRandomName())
    }
    return [...new Set<string>(names)]
}

export const genTestMessageFiles = (msgNames: string[]): [string, string][] => {
    const count = randomNumber(1, 7)
    let i = 0
    let files: [string, string][] = []
    while (i < count) {
        const names = genMsgNames()
        const imports = genImports(msgNames)
        files = [...files, [`test${i}.ts`, imports.concat(genRpcMessages([...names], msgNames))]]
        i++
    }
    return files
}
