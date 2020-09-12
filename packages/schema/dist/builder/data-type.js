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
exports.useCbor = exports.makeDataType = exports.isType = void 0;
const index_1 = require("../index");
const validator_1 = require("../validator");
const parser_1 = require("../parser");
exports.isType = (type, typeText) => type.getText().trim().startsWith(typeText);
exports.makeDataType = (type) => {
    if (!validator_1.isValidDataType(type)) {
        throw index_1.typeError(type);
    }
    const prim = index_1.make.scalar(type);
    if (prim) {
        return prim;
    }
    if (validator_1.isMsgLiteral(type)) {
        return index_1.make.structLiteral(type, exports.makeDataType);
    }
    if (!validator_1.isContainer(type)) {
        return index_1.make.struct(type);
    }
    if (exports.isType(type, '$.list')) {
        return index_1.make.list(type, exports.makeDataType);
    }
    if (exports.isType(type, '$.map')) {
        return index_1.make.map(type, exports.makeDataType);
    }
    if (exports.isType(type, '$.tuple')) {
        return index_1.make.tuple(type, exports.makeDataType);
    }
    return index_1.make.dyn;
};
// Determines if the generated type or method should use cbor for serialization/deserialization
// based on the JsDoc @kind tag
exports.useCbor = (type) => {
    var _a, _b, _c;
    if (typeof type === 'undefined') {
        return false;
    }
    const comment = (_c = (_b = (_a = parser_1.parseJsDocComment(type, 'kind')) === null || _a === void 0 ? void 0 : _a.trim()) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== null && _c !== void 0 ? _c : '';
    return comment.includes('cbor');
};
//# sourceMappingURL=data-type.js.map