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
exports._testing = exports.containers = exports.scalars = exports.queryParamables = exports.typeError = exports.is = exports.make = exports.isQuerySvc = exports.isQueryMethod = exports.isMutationMethod = exports.isMutationSvc = exports.validateSchemas = exports.buildSchemas = void 0;
const data_type_1 = require("./data-type");
Object.defineProperty(exports, "containers", { enumerable: true, get: function () { return data_type_1.containers; } });
Object.defineProperty(exports, "queryParamables", { enumerable: true, get: function () { return data_type_1.queryParamables; } });
Object.defineProperty(exports, "scalars", { enumerable: true, get: function () { return data_type_1.scalars; } });
const make_1 = require("./make");
Object.defineProperty(exports, "make", { enumerable: true, get: function () { return make_1.make; } });
Object.defineProperty(exports, "typeError", { enumerable: true, get: function () { return make_1.typeError; } });
const is_1 = require("./is");
Object.defineProperty(exports, "is", { enumerable: true, get: function () { return is_1.is; } });
const builder_1 = require("./builder");
Object.defineProperty(exports, "buildSchemas", { enumerable: true, get: function () { return builder_1.buildSchemas; } });
const validator_1 = require("./validator");
Object.defineProperty(exports, "validateSchemas", { enumerable: true, get: function () { return validator_1.validateSchemas; } });
const parser_1 = require("./parser");
const schema_1 = require("./schema");
Object.defineProperty(exports, "isMutationMethod", { enumerable: true, get: function () { return schema_1.isMutationMethod; } });
Object.defineProperty(exports, "isMutationSvc", { enumerable: true, get: function () { return schema_1.isMutationSvc; } });
Object.defineProperty(exports, "isQueryMethod", { enumerable: true, get: function () { return schema_1.isQueryMethod; } });
Object.defineProperty(exports, "isQuerySvc", { enumerable: true, get: function () { return schema_1.isQuerySvc; } });
exports._testing = Object.assign(Object.assign(Object.assign({}, builder_1.internalTesting), validator_1.internal), { parseMsgProps: parser_1.parseMsgProps,
    parseMessages: parser_1.parseMessages,
    parseMutationServices: parser_1.parseMutationServices,
    parseQueryServices: parser_1.parseQueryServices,
    isOptionalProp: parser_1.isOptionalProp,
    parseServiceMethods: parser_1.parseServiceMethods });
//# sourceMappingURL=index.js.map