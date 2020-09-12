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
exports.validateMessages = exports.validateMessage = void 0;
const utils_1 = require("./utils");
const parser_1 = require("../parser");
const validateProp = (prop) => utils_1.isValidDataType(prop.getTypeNode())
    ? []
    : [
        utils_1.singleValidationErr(prop, 'Invalid property type, Only messages imported from @typerpc/messages, rpc.Msg messages, and other rpc.Msg messages declared in the same file may be used as property messages'),
    ];
const validateMsgProps = (props) => {
    let errs = [];
    for (const prop of props) {
        const type = prop.getTypeNode();
        // if the property is a message literal, call validateMsgProps
        // recursively
        if (typeof type !== 'undefined' && utils_1.isMsgLiteral(type)) {
            errs = errs.concat(validateMsgProps(parser_1.parseMsgProps(type)));
        }
        errs = errs.concat(validateProp(prop));
    }
    return errs;
};
exports.validateMessage = (msg) => {
    if (parser_1.parseMsgProps(msg).length === 0) {
        return [utils_1.singleValidationErr(msg, 'Message has no properties. Empty messages are not allowed.')];
    }
    return validateMsgProps(parser_1.parseMsgProps(msg));
};
exports.validateMessages = (file) => parser_1.parseMessages(file).flatMap((msg) => exports.validateMessage(msg));
//# sourceMappingURL=message.js.map