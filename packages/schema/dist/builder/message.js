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
exports.buildMessages = void 0;
const parser_1 = require("../parser");
const data_type_1 = require("./data-type");
const buildProps = (properties) => properties.map((prop) => {
    return {
        isOptional: parser_1.isOptionalProp(prop),
        type: data_type_1.makeDataType(prop.getTypeNodeOrThrow()),
        name: prop.getName().trim(),
    };
});
// Converts all rpc.Msg types in files into Schema Messages
exports.buildMessages = (file) => {
    const messages = parser_1.parseMessages(file);
    if (messages.length === 0) {
        return [];
    }
    return [
        ...new Set(messages.map((msg) => {
            return {
                name: msg.getNameNode().getText().trim(),
                properties: [...new Set(buildProps(parser_1.parseMsgProps(msg)))],
            };
        })),
    ];
};
//# sourceMappingURL=message.js.map