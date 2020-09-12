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
exports.is = void 0;
/* eslint-disable new-cap */
const data_type_1 = require("./data-type");
const validateType = (type, ...propNames) => {
    const props = Object.getOwnPropertyNames(type).filter((prop) => !prop.includes('toString'));
    return propNames.every((name) => props.includes(name)) && props.length === propNames.length;
};
// validate every TupleN type by ensuring it has itemN property names.
const validateTuple = (type, numItems) => {
    let props = [];
    let i = 0;
    while (i < numItems) {
        props = props.concat(`item${i + 1}`);
        i++;
    }
    return validateType(type, ...props);
};
// functions to validate the type of a variable
exports.is = {
    map: (type) => validateType(type, 'keyType', 'valType'),
    tuple2: (type) => validateTuple(type, 2),
    tuple3: (type) => validateTuple(type, 3),
    tuple4: (type) => validateTuple(type, 4),
    tuple5: (type) => validateTuple(type, 5),
    list: (type) => validateType(type, 'dataType'),
    struct: (type) => validateType(type, 'name', 'useCbor'),
    structLiteral: (type) => validateType(type, 'properties'),
    container: (type) => [
        exports.is.struct,
        exports.is.list,
        exports.is.map,
        exports.is.tuple2,
        exports.is.tuple3,
        exports.is.tuple4,
        exports.is.tuple3,
        exports.is.tuple5,
        exports.is.structLiteral,
    ].some((func) => func(type)),
    queryParamable: (type) => data_type_1.queryParamables.some((param) => type.toString().startsWith(param)),
    scalar: (type) => !exports.is.container(type) && data_type_1.scalarsMap.has(type.toString()),
    dataType: (type) => exports.is.container(type) || exports.is.scalar(type),
};
//# sourceMappingURL=is.js.map