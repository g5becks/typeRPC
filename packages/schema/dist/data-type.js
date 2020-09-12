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
exports.queryParamables = exports.containers = exports.scalarsMap = exports.scalars = exports.structLiteralProp = void 0;
const make_1 = require("./make");
exports.structLiteralProp = (name, type, isOptional) => {
    return {
        name,
        type,
        isOptional,
        toString() {
            return `${name}${isOptional ? '?' : ''}: ${type.toString()};`;
        },
    };
};
const builtScalars = [
    make_1.make.blob,
    make_1.make.unit,
    make_1.make.timestamp,
    make_1.make.dyn,
    make_1.make.str,
    make_1.make.nil,
    make_1.make.float64,
    make_1.make.float32,
    make_1.make.uint64,
    make_1.make.int64,
    make_1.make.uint32,
    make_1.make.int32,
    make_1.make.uint16,
    make_1.make.int16,
    make_1.make.uint8,
    make_1.make.int8,
    make_1.make.bool,
];
exports.scalars = [
    '$.blob',
    '$.unit',
    '$.timestamp',
    '$.dyn',
    '$.str',
    '$.nil',
    '$.float64',
    '$.float32',
    '$.uint64',
    '$.int64',
    '$.uint32',
    '$.int32',
    '$.uint16',
    '$.int16',
    '$.uint8',
    '$.int8',
    '$.bool',
];
exports.scalarsMap = new Map(exports.scalars.map((prim, i) => [prim, builtScalars[i]]));
exports.containers = ['$.map', '$.tuple2', '$.tuple3', '$.tuple4', '$.tuple5', '$.list'];
// types that are valid to use a query param in a get request
exports.queryParamables = [
    '$.bool',
    '$.timestamp',
    '$.int8',
    '$.uint8',
    '$.int16',
    '$.uint16',
    '$.int32',
    '$.uint32',
    '$.uint64',
    '$.int64',
    '$.float32',
    '$.float64',
    '$.str',
    '$.list',
];
//# sourceMappingURL=data-type.js.map