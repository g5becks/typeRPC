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
exports.buildMutationServices = exports.buildQueryServices = exports.buildMutationMethod = exports.buildQueryMethod = exports.buildMethod = exports.hasCborParams = exports.buildParams = exports.buildErrCode = exports.buildResponseCode = void 0;
const data_type_1 = require("./data-type");
const parser_1 = require("../parser");
const validator_1 = require("../validator");
const index_1 = require("../index");
// builds the HTTPResponseCode for a Method Schema using the parsed JsDoc
exports.buildResponseCode = (method) => {
    var _a;
    const comment = (_a = parser_1.parseJsDocComment(method, 'returns')) !== null && _a !== void 0 ? _a : '200';
    const response = parseInt(comment);
    return validator_1.isResponseCode(response) ? response : 200;
};
// builds the HTTPErrCode for a Method Schema using the parsed JsDoc
exports.buildErrCode = (method) => {
    var _a;
    const comment = (_a = parser_1.parseJsDocComment(method, 'throws')) !== null && _a !== void 0 ? _a : '500';
    const response = parseInt(comment);
    return validator_1.isErrCode(response) ? response : 500;
};
// builds all Schema Param for a method
exports.buildParams = (params) => {
    return [
        ...new Set(params.map((param) => {
            return {
                name: param.getName().trim(),
                isOptional: param.isOptional(),
                type: data_type_1.makeDataType(param.getTypeNodeOrThrow()),
            };
        })),
    ];
};
const getMethodName = (method) => method.getNameNode().getText().trim();
exports.hasCborParams = (params, method, isCborSvc) => {
    return [...params].some((param) => index_1.is.struct(param.type) && param.type.useCbor) || isCborSvc || data_type_1.useCbor(method);
};
exports.buildMethod = (method, isCborSvc) => {
    return {
        name: getMethodName(method),
        params: exports.buildParams(method.getParameters()),
        returnType: data_type_1.makeDataType(method.getReturnTypeNodeOrThrow()),
        responseCode: exports.buildResponseCode(method),
        errorCode: exports.buildErrCode(method),
        httpMethod: 'GET',
        get isVoidReturn() {
            return index_1.make.unit === this.returnType;
        },
        get hasCborReturn() {
            return (index_1.is.struct(this.returnType) && this.returnType.useCbor) || isCborSvc || data_type_1.useCbor(method);
        },
        get hasParams() {
            return this.params.length > 0;
        },
    };
};
exports.buildQueryMethod = (method, isCborSvc) => {
    return Object.assign(Object.assign({}, exports.buildMethod(method, isCborSvc)), { httpMethod: 'GET' });
};
exports.buildMutationMethod = (method, isCborSvc) => {
    const builtMethod = exports.buildMethod(method, isCborSvc);
    return Object.assign(Object.assign({}, builtMethod), { httpMethod: 'POST', hasCborParams: exports.hasCborParams(builtMethod.params, method, isCborSvc) });
};
const buildQueryMethods = (methods, isCborSvc) => [
    ...new Set(methods.map((method) => exports.buildQueryMethod(method, isCborSvc))),
];
const buildMutationMethods = (methods, isCborSvc) => [
    ...new Set(methods.map((method) => exports.buildMutationMethod(method, isCborSvc))),
];
const getServiceName = (service) => service.getNameNode().getText().trim();
const buildQuerySvc = (service) => {
    const isCbor = data_type_1.useCbor(service);
    return {
        type: 'QueryService',
        name: getServiceName(service),
        methods: buildQueryMethods(parser_1.parseServiceMethods(service), isCbor),
        useCbor: isCbor,
    };
};
const buildMutationSvc = (service) => {
    const isCbor = data_type_1.useCbor(service);
    return {
        type: 'MutationService',
        name: getServiceName(service),
        methods: buildMutationMethods(parser_1.parseServiceMethods(service), isCbor),
        useCbor: isCbor,
    };
};
exports.buildQueryServices = (file) => {
    const services = parser_1.parseQueryServices(file);
    if (services.length === 0) {
        return [];
    }
    return [...new Set(services.map((svc) => buildQuerySvc(svc)))];
};
exports.buildMutationServices = (file) => {
    const services = parser_1.parseMutationServices(file);
    if (services.length === 0) {
        return [];
    }
    return [...new Set(services.map((svc) => buildMutationSvc(svc)))];
};
// TODO remove all the duplication at some point
//# sourceMappingURL=service.js.map