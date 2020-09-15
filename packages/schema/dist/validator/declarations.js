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
exports.internal = exports.validateDeclarations = void 0;
const ts_morph_1 = require("ts-morph");
const utils_1 = require("./utils");
const message_1 = require("./message");
const validate = (declarations) => declarations.length > 0 ? [utils_1.multiValidationErr(declarations)] : [];
// Ensure zero function declarations
const validateFunctions = (file) => validate(file.getFunctions());
// Ensure zero variable declarations
const validateVariables = (file) => validate(file.getVariableDeclarations());
// Ensure Zero Interfaces
const validateInterfaces = (file) => validate(file.getInterfaces());
// Ensure zero class declarations
const validateClasses = (file) => validate(file.getClasses());
const validateImports = (file, projectFiles) => {
    var _a;
    const imports = file.getImportDeclarations();
    // eslint-disable-next-line no-useless-concat
    const err = (i, msg) => utils_1.singleValidationErr(i, 'invalid import declaration : ' + i.getText() + '\n' + ` reason: ${msg}`);
    let errs = [];
    for (const imp of imports) {
        if (typeof imp.getModuleSpecifierSourceFile() === 'undefined') {
            errs = errs.concat(err(imp, 'module specifier is undefined'));
        }
        else if (imp.getModuleSpecifierValue() !== '@typerpc/types' &&
            !projectFiles.includes(imp.getModuleSpecifierSourceFile())) {
            errs = errs.concat(err(imp, `${(_a = imp.getModuleSpecifierSourceFile()) === null || _a === void 0 ? void 0 : _a.getFilePath().toString()} is not a part of this project`));
        }
        else if (typeof imp.getImportClause() === 'undefined') {
            errs = errs.concat(err(imp, 'import clause is undefined'));
            // eslint-disable-next-line brace-style
        }
        // validate node default or namespace import
        else if (typeof imp.getDefaultImport() !== 'undefined' || typeof imp.getNamespaceImport() !== 'undefined') {
            errs = errs.concat(utils_1.singleValidationErr(imp, 'invalid import statement. typerpc only allows named imports'));
        }
        else {
            const module = imp.getModuleSpecifierValue();
            // validates that the import is located in the same directory by checking
            // that the import starts with ./ and there is only a single slash.
            if (module !== '@typerpc/types' && !module.startsWith('./') && module.split('/').length !== 2) {
                errs = errs.concat(utils_1.singleValidationErr(imp, 'invalid import. Only files located in the same directory are allowed'));
            }
            // validate no aliased imports
            for (const name of imp.getNamedImports()) {
                if (typeof name.getAliasNode() !== 'undefined') {
                    errs = errs.concat(utils_1.singleValidationErr(name, 'import aliasing not allowed'));
                }
            }
        }
    }
    return errs;
};
const validateExports = (file) => {
    var _a;
    let errs = [];
    const exportErr = (exportType) => new Error(`${exportType} found in file ${file
        .getFilePath()
        .toString()} ${exportType}s are not allowed. Try using an export declaration of the form 'export type SomeType' instead. Note: only rpc.Msg types are allowed to be exported`);
    const exported = file.getExportedDeclarations();
    // validate no default exports.
    if (typeof file.getDefaultExportSymbol() !== 'undefined') {
        errs = errs.concat(exportErr('default export'));
    }
    // validate no export assignments. E.G. export =
    if (file.getExportAssignments().length !== 0) {
        errs = errs.concat(exportErr('export assignment'));
    }
    // validate no export lists. E.G. export {location, var, etc}
    if (file.getExportDeclarations().length !== 0) {
        errs = errs.concat(exportErr('export list'));
    }
    // validate only rpc.Msg is exported
    if (exported.size > 0) {
        for (const v of exported.values()) {
            if (v.length !== 1) {
                errs = errs.concat(exportErr('invalid export declaration'));
            }
            for (const type of v) {
                if (!((_a = type.getFirstChildByKind(ts_morph_1.SyntaxKind.TypeReference)) === null || _a === void 0 ? void 0 : _a.getText().startsWith('rpc.Msg<{'))) {
                    errs = errs.concat(exportErr('non rpm.Msg type'));
                }
            }
        }
    }
    return errs;
};
// Ensure zero namespaces
const validateNameSpaces = (file) => validate(file.getNamespaces());
// Ensure zero top level statements
const validateStatements = (file) => {
    const stmnts = file.getStatements();
    const invalidKinds = [
        ts_morph_1.SyntaxKind.AbstractKeyword,
        ts_morph_1.SyntaxKind.AwaitExpression,
        ts_morph_1.SyntaxKind.ArrayType,
        ts_morph_1.SyntaxKind.ArrowFunction,
        ts_morph_1.SyntaxKind.TaggedTemplateExpression,
        ts_morph_1.SyntaxKind.SpreadAssignment,
        ts_morph_1.SyntaxKind.JsxExpression,
        ts_morph_1.SyntaxKind.ForStatement,
        ts_morph_1.SyntaxKind.ForInStatement,
        ts_morph_1.SyntaxKind.ForOfStatement,
        ts_morph_1.SyntaxKind.SwitchStatement,
        ts_morph_1.SyntaxKind.LessThanLessThanEqualsToken,
    ];
    const invalids = stmnts.filter((stmnt) => invalidKinds.includes(stmnt.getKind()));
    return invalids.length > 0 ? [utils_1.multiValidationErr(invalids)] : [];
};
// Ensure zero enums
const validateEnums = (file) => validate(file.getEnums());
// Ensure zero references to other files
const validateRefs = (file) => {
    const errs = [];
    // should be 1
    const nodeSourceRefs = file.getNodesReferencingOtherSourceFiles();
    if (nodeSourceRefs.length !== 1) {
        errs.push(utils_1.multiValidationErr(nodeSourceRefs));
    }
    // should be 1
    const literalSourceRefs = file.getLiteralsReferencingOtherSourceFiles();
    if (literalSourceRefs.length !== 1) {
        errs.push(utils_1.multiValidationErr(literalSourceRefs));
    }
    // should be 1
    const sourceRefs = file.getReferencedSourceFiles();
    if (sourceRefs.length !== 1) {
        errs.push(utils_1.multiValidationErr(sourceRefs));
    }
    const otherErr = (msg) => new Error(`error in file: ${file.getFilePath().toString()}
  message: ${msg}`);
    // should be 0
    const libraryRefs = file.getLibReferenceDirectives();
    if (libraryRefs.length > 0) {
        errs.push(otherErr('library reference found'));
    }
    // should be 0
    const pathRefs = file.getPathReferenceDirectives();
    if (pathRefs.length > 0) {
        errs.push(otherErr('path reference found'));
    }
    // should be 0
    const typeDirRefs = file.getTypeReferenceDirectives();
    if (typeDirRefs.length > 0) {
        errs.push(otherErr('type directive reference found'));
    }
    return errs;
};
const validateJsDoc = (type) => {
    if (type.getJsDocs().length === 0) {
        return [];
    }
    const tags = type
        .getJsDocs()[0]
        .getTags()
        .filter((tag) => tag.getTagName() === 'kind');
    if (tags.length > 0 && tags.length !== 1) {
        return [utils_1.singleValidationErr(tags[0], 'A message or service can only have a single @kind tag')];
    }
    // eslint-disable-next-line no-negated-condition
    return tags[0].getComment() !== 'cbor'
        ? [
            utils_1.singleValidationErr(tags[0], `there is only one valid comment for the @kind tag (cbor), found ${tags[0].getComment()}`),
        ]
        : [];
};
// Runs a pre-validation step on all type aliases found in a schema file
// to ensure they are eligible to move forward into the next validation stage.
// This check ensures the type is either an rpc.QueryService or rpc.Msg,
// that the type has a typeNode, that the typeNode is a TypeLiteral
// and that the type is not generic
const preValidateType = (type) => {
    let errs = [];
    if (typeof type.getTypeNode() === 'undefined') {
        return [utils_1.singleValidationErr(type, `${type.getName()} has no type node`)];
    }
    if (type.getTypeNode().getChildrenOfKind(ts_morph_1.SyntaxKind.TypeLiteral).length !== 1) {
        return [
            utils_1.singleValidationErr(type, `All typerpc messages and services must be Type Literals, E.G.
      type  Mytype = {
      (properties with valid type rpc data types or other rpc.Msg types)
      },
      Typescript types (number, string[]), intersections, and unions are not supported.`),
        ];
    }
    if (!utils_1.isMsg(type) && utils_1.isQuerySvc(type) && utils_1.isMutationSvc(type)) {
        errs = errs.concat(utils_1.singleValidationErr(type, 'typerpc schema files can only declare rpc.Msg, rpc.QuerySvc and rpc.MutationSvc definitions.'));
    }
    errs = [...errs, ...utils_1.validateNotGeneric(type), ...validateJsDoc(type)];
    return errs;
};
const validateTypes = (file) => file.getTypeAliases().flatMap((alias) => preValidateType(alias));
exports.validateDeclarations = (file, projectFiles) => {
    return [
        ...validateFunctions(file),
        ...validateVariables(file),
        ...validateInterfaces(file),
        ...validateClasses(file),
        ...validateImports(file, projectFiles),
        ...validateExports(file),
        ...validateNameSpaces(file),
        ...validateStatements(file),
        ...validateEnums(file),
        ...validateRefs(file),
        ...validateTypes(file),
    ];
};
exports.internal = {
    validateTypes,
    validateJsDoc,
    validateExports,
    validateImports,
    validateEnums,
    validateNameSpaces,
    validateClasses,
    validateStatements,
    validateVariables,
    validateInterfaces,
    validateFunctions,
    validateMessages: message_1.validateMessages,
};
//# sourceMappingURL=declarations.js.map
