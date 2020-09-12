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
exports.make = exports.typeError = void 0;
const data_type_1 = require("./data-type");
const parser_1 = require("./parser");
const builder_1 = require("./builder");
const validator_1 = require("./validator");
exports.typeError = (type) => new TypeError(`error in file ${type.getSourceFile().getFilePath()}
    at line number: ${type.getStartLineNumber()}
    message: ${type.getText()} is neither a valid typerpc DataType or rpc.Msg that was imported or defined in this file.`);
const makeStructLiteralProps = (props, makeDataType) => props.map((prop) => data_type_1.structLiteralProp(prop.getName(), makeDataType(prop.getTypeNodeOrThrow()), parser_1.isOptionalProp(prop)));
exports.make = {
    struct: (type) => {
        var _a, _b;
        // get the text of the Type field
        const name = (_a = type.getText()) === null || _a === void 0 ? void 0 : _a.trim();
        const alias = type.getSourceFile().getTypeAlias(name);
        if (!validator_1.isValidMsg(type)) {
            throw exports.typeError(type);
        }
        return {
            name: (_b = type.getText()) === null || _b === void 0 ? void 0 : _b.trim(),
            useCbor: builder_1.useCbor(alias),
            toString() {
                return this.name;
            },
        };
    },
    structLiteral: (type, makeDataType) => {
        const properties = makeStructLiteralProps(parser_1.parseMsgProps(type), makeDataType);
        return {
            properties,
            toString() {
                let props = '';
                for (const prop of properties) {
                    props = props.concat(prop + '\n');
                }
                return `rpc.Msg<{${props}}>`;
            },
        };
    },
    map: (type, makeDataType) => {
        const params = parser_1.parseTypeParams(type);
        const keyType = exports.make.scalar(params[0]);
        const valType = makeDataType(params[1]);
        if (!keyType) {
            throw exports.typeError(type);
        }
        return {
            keyType,
            valType,
            toString() {
                return `$.map<${keyType.toString()}, ${valType.toString()}>`;
            },
        };
    },
    tuple: (type, makeDataType) => {
        const params = parser_1.parseTypeParams(type);
        const item1 = makeDataType(params[0]);
        const item2 = makeDataType(params[1]);
        switch (params.length) {
            case 2:
                return {
                    item1,
                    item2,
                    toString() {
                        return `$.tuple2<${item1.toString()}, ${item2.toString()}>`;
                    },
                };
            case 3: {
                const item3 = makeDataType(params[2]);
                return {
                    item1,
                    item2,
                    item3,
                    toString() {
                        return `$.tuple3<${item1.toString()}, ${item2.toString()}, ${item3.toString()}>`;
                    },
                };
            }
            case 4: {
                const item3 = makeDataType(params[2]);
                const item4 = makeDataType(params[3]);
                return {
                    item1,
                    item2,
                    item3,
                    item4,
                    toString() {
                        return `$.tuple4<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}>`;
                    },
                };
            }
            case 5: {
                const item3 = makeDataType(params[2]);
                const item4 = makeDataType(params[3]);
                const item5 = makeDataType(params[4]);
                return {
                    item1,
                    item2,
                    item3,
                    item4,
                    item5,
                    toString() {
                        return `$.tuple5<${item1.toString()}, ${item2.toString()}, ${item3.toString()}, ${item4.toString()}, ${item5.toString()}>`;
                    },
                };
            }
            default:
                throw exports.typeError(type);
        }
    },
    list: (type, makeDataType) => {
        const dataType = makeDataType(parser_1.parseTypeParams(type)[0]);
        return {
            dataType,
            toString() {
                return `$.list<${dataType.toString()}>`;
            },
        };
    },
    scalar: (type) => data_type_1.scalarsMap.get(type.getText().trim()),
    get bool() {
        return { type: 'bool', toString: () => '$.bool' };
    },
    get int8() {
        return { type: 'int8', toString: () => '$.int8' };
    },
    get uint8() {
        return { type: 'uint8', toString: () => '$.uint8' };
    },
    get int16() {
        return { type: 'int16', toString: () => '$.int16' };
    },
    get uint16() {
        return { type: 'uint16', toString: () => '$.uint16' };
    },
    get int32() {
        return { type: 'int32', toString: () => '$.int32' };
    },
    get uint32() {
        return { type: 'uint32', toString: () => '$.uint32' };
    },
    get int64() {
        return { type: 'int64', toString: () => '$.int64' };
    },
    get uint64() {
        return { type: 'uint64', toString: () => '$.uint64' };
    },
    get float32() {
        return { type: 'float32', toString: () => '$.float32' };
    },
    get float64() {
        return { type: 'float64', toString: () => '$.float64' };
    },
    get nil() {
        return { type: 'nil', toString: () => '$.nil' };
    },
    get str() {
        return { type: 'str', toString: () => '$.str' };
    },
    get dyn() {
        return { type: 'dyn', toString: () => '$.dyn' };
    },
    get timestamp() {
        return { type: 'timestamp', toString: () => '$.timestamp' };
    },
    get unit() {
        return { type: 'unit', toString: () => '$.unit' };
    },
    get blob() {
        return { type: 'blob', toString: () => '$.blob' };
    },
};
//# sourceMappingURL=make.js.map