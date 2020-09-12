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
exports.internalTesting = exports.buildSchemas = exports.useCbor = void 0;
const message_1 = require("./message");
const service_1 = require("./service");
const data_type_1 = require("./data-type");
Object.defineProperty(exports, "useCbor", { enumerable: true, get: function () { return data_type_1.useCbor; } });
const buildImports = (file) => file
    .getImportDeclarations()
    .filter((imp) => imp.getModuleSpecifierValue() !== '@typerpc/types')
    .map((imp) => {
    return {
        messageNames: imp.getNamedImports().map((name) => name.getName()),
        fileName: imp.getModuleSpecifierValue().replace('./', ''),
    };
});
const buildSchema = (file, packageName) => {
    return {
        packageName,
        imports: buildImports(file),
        fileName: file.getBaseNameWithoutExtension(),
        messages: message_1.buildMessages(file),
        queryServices: service_1.buildQueryServices(file),
        mutationServices: service_1.buildMutationServices(file),
        get hasCbor() {
            return (this.mutationServices
                .flatMap((svc) => [...svc.methods])
                .some((method) => method.hasCborParams || method.hasCborReturn) ||
                this.queryServices.flatMap((svc) => [...svc.methods]).some((method) => method.hasCborReturn));
        },
    };
};
exports.buildSchemas = (sourceFiles, packageName) => [
    ...new Set(sourceFiles.map((file) => buildSchema(file, packageName))),
];
exports.internalTesting = {
    useCbor: data_type_1.useCbor,
    isType: data_type_1.isType,
    buildSchema,
    buildParams: service_1.buildParams,
    buildMessages: message_1.buildMessages,
    buildErrCode: service_1.buildErrCode,
    buildResponseCode: service_1.buildResponseCode,
    makeDataType: data_type_1.makeDataType,
    buildMutationMethod: service_1.buildMutationMethod,
    buildMethod: service_1.buildMethod,
    buildQueryMethod: service_1.buildQueryMethod,
    hasCborParams: service_1.hasCborParams,
    buildImports,
};
//# sourceMappingURL=index.js.map