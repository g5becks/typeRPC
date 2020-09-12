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
exports.serviceValidatorTesting = exports.validateServices = exports.isErrCode = exports.isResponseCode = exports.responseCodes = exports.errCodes = void 0;
const utils_1 = require("./utils");
const parser_1 = require("../parser");
const index_1 = require("../index");
// Valid HTTP error codes
exports.errCodes = [
    400,
    401,
    402,
    403,
    404,
    405,
    406,
    407,
    408,
    409,
    410,
    411,
    412,
    413,
    414,
    415,
    416,
    417,
    418,
    422,
    425,
    426,
    428,
    429,
    431,
    451,
    500,
    501,
    502,
    503,
    504,
    505,
    506,
    507,
    508,
    510,
    511,
];
// Valid HTTP success status codes
exports.responseCodes = [200, 201, 202, 203, 204, 205, 206, 300, 301, 302, 303, 304, 305, 306, 307, 308];
// is the number used in the JsDoc @returns tag a valid typerpc HTTPResponseCode?
exports.isResponseCode = (code) => exports.responseCodes.includes(code !== null && code !== void 0 ? code : 0);
// is the number used in the JsDoc @throws tag a valid typerpc HTTPErrCode?
exports.isErrCode = (code) => exports.errCodes.includes(code !== null && code !== void 0 ? code : 0);
const validateMethodJsDoc = (method) => {
    var _a, _b, _c;
    const tags = (_a = method.getJsDocs()[0]) === null || _a === void 0 ? void 0 : _a.getTags();
    if (typeof tags === 'undefined' || tags.length === 0) {
        return [];
    }
    const errs = [];
    for (const tag of tags) {
        const tagName = tag.getTagName();
        const comment = (_c = (_b = tag === null || tag === void 0 ? void 0 : tag.getComment()) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
        if (tagName === 'throws') {
            const err = utils_1.singleValidationErr(tag, `${comment} is not a valid HTTP error response code. Valid error response codes are : ${exports.errCodes}`);
            try {
                // eslint-disable-next-line radix
                if (!exports.isErrCode(parseInt(comment))) {
                    errs.push(err);
                }
            }
            catch (error) {
                errs.push(err);
            }
        }
        if (tagName === 'kind' && comment.toLowerCase() !== 'cbor') {
            errs.push(utils_1.singleValidationErr(tag, `invalid usage of @kind tag. The only valid value for the @kind tag is 'cbor', found: ${comment}`));
        }
        if (tagName === 'returns') {
            const err = utils_1.singleValidationErr(tag, `${tag.getComment()} is not a valid HTTP success response code. Valid success response codes are : ${exports.responseCodes}`);
            try {
                // eslint-disable-next-line radix
                if (!exports.isResponseCode(parseInt(comment))) {
                    errs.push(err);
                }
            }
            catch (error) {
                errs.push(err);
            }
        }
    }
    return errs;
};
const validateQueryMethodParam = (param) => {
    return index_1.queryParamables.some((val) => param.getTypeNode().getText().trim().startsWith(val))
        ? []
        : [
            utils_1.singleValidationErr(param, `${param.getName()} has an invalid type. Methods annotated with @access GET are only allowed to use the following types for parameters: ${index_1.queryParamables}. Note: a t.List<> can only use one of the mentioned primitive types as a type parameter`),
        ];
};
// validates that all methods of an rpc.QuerySvc have valid params
const validateQueryMethodParams = (method) => {
    const params = method.getParameters();
    if (params.length === 0) {
        return [];
    }
    return params.flatMap((param) => validateQueryMethodParam(param));
};
// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same project.
const validateReturnType = (method) => utils_1.isValidDataType(method.getReturnTypeNode())
    ? []
    : [
        utils_1.singleValidationErr(method, `${method.getName()} has an invalid return type. All rpc.Service methods must return a valid typerpc type, an rpc.Msg literal, or an rpc.Msg defined in the same file. To return nothing, use 't.unit'`),
    ];
// Ensure type of method params is either a typerpc type or a type
// declared in the same source project.
const validateParams = (method) => 
// eslint-disable-next-line no-negated-condition
!method.getParameters()
    ? []
    : method
        .getParameters()
        .map((param) => param.getTypeNode())
        .flatMap((type) => utils_1.isValidDataType(type)
        ? []
        : utils_1.singleValidationErr(type, `method parameter type '${type === null || type === void 0 ? void 0 : type.getText().trim()}', is either not a valid typerpc type or a type alias that is not defined in this file`));
// Validates all methods of an rpc.QueryService
const validateService = (service) => parser_1.parseServiceMethods(service).flatMap((method) => [
    ...validateParams(method),
    ...validateReturnType(method),
    ...utils_1.validateNotGeneric(method),
    ...validateMethodJsDoc(method),
    ...validateQueryMethodParams(method),
]);
exports.validateServices = (file) => parser_1.parseQueryServices(file).flatMap((type) => validateService(type));
exports.serviceValidatorTesting = {
    validateService,
    validateNotGeneric: utils_1.validateNotGeneric,
    validateReturnType,
    validateMethodJsDoc,
    validateQueryMethodParams,
};
//# sourceMappingURL=service.js.map