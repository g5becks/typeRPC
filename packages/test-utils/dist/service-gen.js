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
exports.genServices = void 0;
// generate a random param type to use when generating an rpc.QuerySvc
const data_gen_1 = require("./data-gen");
const message_gen_1 = require("./message-gen");
const index_1 = require("./index");
const genQuerySvcParamType = () => {
    const generated = [data_gen_1.genRandomQueryParamableScalar(), data_gen_1.genRandomQueryParamableList()];
    return generated[data_gen_1.randomNumber(0, generated.length)];
};
const genMutationSvcParamType = (msgNames) => {
    const generated = [
        data_gen_1.genRandomDataType(msgNames),
        message_gen_1.genRpcMsgLiteral(msgNames),
        data_gen_1.genRandomDataType(msgNames),
        data_gen_1.genRandomDataType(msgNames),
    ];
    return generated[data_gen_1.randomNumber(0, generated.length)];
};
// gen a method param
const genParam = (type, isOptional, msgNames) => {
    const param = data_gen_1.genRandomName() + `${isOptional ? '?' : ''}:`;
    return type === 'Query' ? `${param} ${genQuerySvcParamType()}` : `${param} ${genMutationSvcParamType(msgNames)}`;
};
const genReturnType = (msgNames) => {
    const generated = [
        data_gen_1.genRandomDataType(msgNames),
        data_gen_1.genRandomDataType(msgNames),
        data_gen_1.genRandomDataType(msgNames),
        message_gen_1.genRpcMsgLiteral(msgNames),
    ];
    return generated[data_gen_1.randomNumber(0, generated.length)];
};
// gen a method for an rpc.Service
const genMethod = (type, msgNames) => {
    const paramsCount = data_gen_1.randomNumber(0, 6);
    let params = '';
    for (let i = 0; i < paramsCount; i++) {
        const useComma = i === paramsCount - 1 ? '' : ', ';
        if (i < 3) {
            params = params.concat(`${genParam(type, false, msgNames)}${useComma}`);
        }
        else {
            params = params.concat(`${genParam(type, true, msgNames)}${useComma}`);
        }
    }
    return `

  ${data_gen_1.genRandomName().toLowerCase()}(${params}): ${genReturnType(msgNames)};`;
};
const genSvc = (type, msgNames, cbor) => {
    const methodCount = data_gen_1.randomNumber(5, 12);
    let methods = '';
    for (let i = 0; i < methodCount; i++) {
        methods = methods.concat(genMethod(type, msgNames) + '\n\n');
    }
    return `
  ${cbor ? index_1.useCbor() : ''}
  type ${data_gen_1.genRandomName().toLowerCase()} = rpc.${type}Svc<{
    ${methods}
  }>\n`;
};
exports.genServices = (type, msgNames) => {
    const num = data_gen_1.randomNumber(5, 12);
    let services = '';
    for (let i = 0; i < num; i++) {
        services = services.concat(genSvc(type, msgNames, false));
    }
    return index_1.genImports(msgNames).concat(services);
};
//# sourceMappingURL=service-gen.js.map