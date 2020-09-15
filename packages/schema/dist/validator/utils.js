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
exports.isValidDataType = exports.isMsgLiteral = exports.validateNotGeneric = exports.singleValidationErr = exports.multiValidationErr = exports.isValidMsg = exports.isMutationSvc = exports.isQuerySvc = exports.isMsg = exports.isContainer = exports.isScalar = void 0;
const index_1 = require("../index");
const parser_1 = require("../parser");
// is the type found is a typerpc scalar type?
exports.isScalar = (type) => Boolean(index_1.make.scalar(type));
// is the type found a typerpc container type?
exports.isContainer = (type) => index_1.containers.some((container) => type.getText().trim().startsWith(container));
// is the type alias or node an rpc.Msg?
exports.isMsg = (type) => { var _a; return Boolean((_a = type.getTypeNode()) === null || _a === void 0 ? void 0 : _a.getText().startsWith('rpc.Msg')); };
const getTypeNodeText = (type) => { var _a; return (_a = type.getTypeNode()) === null || _a === void 0 ? void 0 : _a.getText(); };
// is the type alias an rpc.QuerySvc?
exports.isQuerySvc = (type) => { var _a; return Boolean((_a = getTypeNodeText(type)) === null || _a === void 0 ? void 0 : _a.trim().startsWith('rpc.QuerySvc')); };
// determines if the type alias an rpc.MutationSvc
exports.isMutationSvc = (type) => { var _a; return Boolean((_a = getTypeNodeText(type)) === null || _a === void 0 ? void 0 : _a.trim().startsWith('rpc.MutationSvc')); };
// determines if the type alias is a valid rpc.Msg that was either
// defined is this file or imported location another file in this project.
exports.isValidMsg = (type) => {
    const file = type.getSourceFile();
    const typeText = type.getText().trim();
    const isLocal = file
        .getTypeAliases()
        .flatMap((alias) => alias.getName())
        .includes(typeText);
    const isImported = parser_1.parseNamedImports(file).includes(typeText);
    return isLocal || isImported;
};
const canGetName = (type) => 'getName' in type;
// Returns an error about number of schema violation
exports.multiValidationErr = (violators) => {
    var _a;
    return new Error(`${(_a = violators[0].getSourceFile().getFilePath()) === null || _a === void 0 ? void 0 : _a.toString()} contains ${violators.length} ${violators[0].getKindName()} declarations
   errors: ${violators.map((vio) => {
        var _a;
        return canGetName(vio)
            ? (_a = vio.getName()) === null || _a === void 0 ? void 0 : _a.trim() : vio.getText().trim() + ', at line number: ' + String(vio === null || vio === void 0 ? void 0 : vio.getStartLineNumber()) + '\n';
    })}
   message: typerpc schemas can only contain a single import statement (import {t} from '@typerpc/types'), typeAlias (message), and interface (service) declarations.`);
};
// Returns a single schema violation error
exports.singleValidationErr = (node, msg) => {
    var _a;
    return new Error(`error in file: ${(_a = node === null || node === void 0 ? void 0 : node.getSourceFile()) === null || _a === void 0 ? void 0 : _a.getFilePath()}
     at line number: ${node === null || node === void 0 ? void 0 : node.getStartLineNumber()}
     message: ${msg}`);
};
// error message for generic messages
const genericsErrMsg = (type) => `${type.getName().trim()} defines a generic type . typerpc types and methods cannot be generic`;
// validates that a type alias or method is not generic
exports.validateNotGeneric = (type) => {
    return type.getTypeParameters().length > 0 ? [exports.singleValidationErr(type, genericsErrMsg(type))] : [];
};
// is the node an rpc.Msg literal?
exports.isMsgLiteral = (type) => type.getText().trim().startsWith('rpc.Msg<{');
// is the node a valid typerpc data type?
exports.isValidDataType = (type) => {
    if (typeof type === 'undefined') {
        return false;
    }
    return exports.isScalar(type) || exports.isContainer(type) || exports.isValidMsg(type) || exports.isMsgLiteral(type);
};
//# sourceMappingURL=utils.js.map