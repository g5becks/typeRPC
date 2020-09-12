"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.genTestMessageFiles = exports.genMsgNames = exports.genRpcMessages = exports.genRpcMsgLiteral = void 0;
const data_gen_1 = require("./data-gen");
const index_1 = require("./index");
exports.genRpcMsgLiteral = (msgNames) => {
    let props = '';
    const propCount = data_gen_1.randomNumber(5, 12);
    for (let i = 0; i < propCount; i++) {
        props = props.concat(`prop${i}${index_1.optional()}: ${data_gen_1.genRandomDataType(msgNames)};\n`);
    }
    return `rpc.Msg<{${props}}>`;
};
const genRpcMsg = (name, msgNames) => `
  ${index_1.useCbor()}
  type ${name} = ${exports.genRpcMsgLiteral(msgNames)}
  `;
exports.genRpcMessages = (names, msgNames) => {
    let types = '';
    for (const name of names) {
        types = types.concat(genRpcMsg(name, msgNames));
    }
    return types;
};
exports.genMsgNames = () => {
    const num = data_gen_1.randomNumber(30, 50);
    let names = [];
    for (let i = 0; i < num; i++) {
        names = names.concat(data_gen_1.genRandomName());
    }
    return [...new Set(names)];
};
exports.genTestMessageFiles = (msgNames) => {
    const count = data_gen_1.randomNumber(1, 7);
    let i = 0;
    let files = [];
    while (i < count) {
        const names = exports.genMsgNames();
        const imports = index_1.genImports(msgNames);
        files = [...files, [`test${i}.ts`, imports.concat(exports.genRpcMessages([...names], msgNames))]];
        i++;
    }
    return files;
};
//# sourceMappingURL=message-gen.js.map