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
exports.parseServiceMethods = exports.parseMutationServices = exports.parseQueryServices = exports.parseMessages = exports.parseJsDocComment = exports.parseTypeParams = exports.parseNamedImports = exports.parseMsgProps = exports.isOptionalProp = void 0;
const ts_morph_1 = require("ts-morph");
const validator_1 = require("../validator");
const isTypeAlias = (type) => 'getName' in type;
const isTypeNode = (type) => !('getName' in type);
// is the type property optional?
exports.isOptionalProp = (prop) => typeof prop.getQuestionTokenNode() !== 'undefined';
// parse all of the properties location an rpc.Msg Type alias for rpc.Msg literal
exports.parseMsgProps = (type) => {
    let kids = [];
    if (isTypeAlias(type)) {
        kids = type
            .getTypeNode()
            .getChildrenOfKind(ts_morph_1.SyntaxKind.TypeLiteral)[0]
            .getChildrenOfKind(ts_morph_1.SyntaxKind.PropertySignature);
    }
    if (isTypeNode(type) && validator_1.isMsgLiteral(type)) {
        kids = type.getChildrenOfKind(ts_morph_1.SyntaxKind.TypeLiteral)[0].getChildrenOfKind(ts_morph_1.SyntaxKind.PropertySignature);
    }
    return kids;
};
// parses all of the named imports for a file
exports.parseNamedImports = (file) => file
    .getImportDeclarations()
    .flatMap((imp) => imp.getNamedImports())
    .flatMap((imp) => imp.getName());
// returns the type parameters portion of the type as an array
exports.parseTypeParams = (type) => type.getChildrenOfKind(ts_morph_1.SyntaxKind.TypeReference);
// gets the comment portion of a JsDoc comment base on the tagName
exports.parseJsDocComment = (method, tagName) => {
    var _a, _b, _c;
    const tags = (_a = method.getJsDocs()[0]) === null || _a === void 0 ? void 0 : _a.getTags();
    return (_c = (_b = tags === null || tags === void 0 ? void 0 : tags.filter((tag) => tag.getTagName() === tagName)[0]) === null || _b === void 0 ? void 0 : _b.getComment()) === null || _c === void 0 ? void 0 : _c.trim();
};
// parses all message declarations location a schema file
exports.parseMessages = (file) => file.getTypeAliases().filter((alias) => validator_1.isMsg(alias));
// parses all rpc.QuerySvc declarations location a schema file
exports.parseQueryServices = (file) => file.getTypeAliases().filter((alias) => validator_1.isQuerySvc(alias));
// parses all rpc.MutationSvc declarations location a schema file
exports.parseMutationServices = (file) => file.getTypeAliases().filter((alias) => validator_1.isMutationSvc(alias));
// parse all of the methods location an rpc.QueryService type alias
exports.parseServiceMethods = (type) => type.getTypeNode().getChildrenOfKind(ts_morph_1.SyntaxKind.TypeLiteral)[0].getChildrenOfKind(ts_morph_1.SyntaxKind.MethodSignature);
//# sourceMappingURL=index.js.map