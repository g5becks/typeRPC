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
exports.internal = exports.isScalar = exports.validateMessage = exports.isResponseCode = exports.isErrCode = exports.isValidDataType = exports.isContainer = exports.isQuerySvc = exports.isMsgLiteral = exports.isValidMsg = exports.isMsg = exports.isMutationSvc = exports.validateSchemas = void 0;
const declarations_1 = require("./declarations");
const message_1 = require("./message");
Object.defineProperty(exports, "validateMessage", { enumerable: true, get: function () { return message_1.validateMessage; } });
const service_1 = require("./service");
Object.defineProperty(exports, "isErrCode", { enumerable: true, get: function () { return service_1.isErrCode; } });
Object.defineProperty(exports, "isResponseCode", { enumerable: true, get: function () { return service_1.isResponseCode; } });
const utils_1 = require("./utils");
Object.defineProperty(exports, "isContainer", { enumerable: true, get: function () { return utils_1.isContainer; } });
Object.defineProperty(exports, "isMsg", { enumerable: true, get: function () { return utils_1.isMsg; } });
Object.defineProperty(exports, "isMsgLiteral", { enumerable: true, get: function () { return utils_1.isMsgLiteral; } });
Object.defineProperty(exports, "isMutationSvc", { enumerable: true, get: function () { return utils_1.isMutationSvc; } });
Object.defineProperty(exports, "isQuerySvc", { enumerable: true, get: function () { return utils_1.isQuerySvc; } });
Object.defineProperty(exports, "isScalar", { enumerable: true, get: function () { return utils_1.isScalar; } });
Object.defineProperty(exports, "isValidDataType", { enumerable: true, get: function () { return utils_1.isValidDataType; } });
Object.defineProperty(exports, "isValidMsg", { enumerable: true, get: function () { return utils_1.isValidMsg; } });
const validateSchema = (file, projectFiles) => {
    return [...declarations_1.validateDeclarations(file, projectFiles), ...message_1.validateMessages(file), ...service_1.validateServices(file)];
};
exports.validateSchemas = (schemas) => schemas.flatMap((schema) => [...validateSchema(schema, schemas)]);
exports.internal = Object.assign(Object.assign(Object.assign({}, declarations_1.internal), service_1.serviceValidatorTesting), { validateMessage: message_1.validateMessage,
    isValidMsg: utils_1.isValidMsg,
    isValidDataType: utils_1.isValidDataType,
    isScalar: utils_1.isScalar });
//# sourceMappingURL=index.js.map