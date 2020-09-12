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
exports.format = exports.logger = exports.parseConfig = exports.getConfigFile = void 0;
const tslib_1 = require("tslib");
const ts_morph_1 = require("ts-morph");
const pino_1 = tslib_1.__importDefault(require("pino"));
const child_process_1 = require("child_process");
exports.getConfigFile = (project) => project.getSourceFile((file) => file.getBaseName().toLowerCase() === '.rpc.config.ts');
const parseGeneratorConfig = (obj) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const outputPath = (_c = (_b = (_a = obj
        .getProperty('outputPath')) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _b === void 0 ? void 0 : _b.getLiteralValue()) === null || _c === void 0 ? void 0 : _c.trim();
    const plugin = (_f = (_e = (_d = obj.getProperty('plugin')) === null || _d === void 0 ? void 0 : _d.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _e === void 0 ? void 0 : _e.getLiteralValue()) === null || _f === void 0 ? void 0 : _f.trim();
    const packageName = (_j = (_h = (_g = obj
        .getProperty('packageName')) === null || _g === void 0 ? void 0 : _g.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _h === void 0 ? void 0 : _h.getLiteralValue()) === null || _j === void 0 ? void 0 : _j.trim();
    const formatter = (_m = (_l = (_k = obj
        .getProperty('formatter')) === null || _k === void 0 ? void 0 : _k.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _l === void 0 ? void 0 : _l.getLiteralValue()) === null || _m === void 0 ? void 0 : _m.trim();
    if (!outputPath || !plugin || !packageName) {
        throw new Error(`
        error in config file: ${obj.getSourceFile().getFilePath()},
        at line number: ${obj.getStartLineNumber()},
        message: all generator config objects must contain the following properties: [outputPath, plugin, packageName]`);
    }
    return { outputPath, plugin, packageName, formatter };
};
exports.parseConfig = (file) => {
    var _a, _b, _c;
    // parse object literal from the config var then get all properties
    const conf = file === null || file === void 0 ? void 0 : file.getVariableDeclaration('config');
    const props = (_a = conf === null || conf === void 0 ? void 0 : conf.getFirstChildByKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.PropertyAssignment);
    // if there are no properties throw and exit
    if (typeof props === 'undefined') {
        throw new Error(`error in config file. Invalid config object, no generators found.`);
    }
    let configs = [];
    // get the Generator config from each property assignment
    // pass is go the parseGeneratorConfig function
    for (const prop of props) {
        configs = configs.concat(Object.assign(Object.assign({}, parseGeneratorConfig(prop.getChildrenOfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)[0])), { configName: (_c = (_b = prop.getFirstChild()) === null || _b === void 0 ? void 0 : _b.getText()) !== null && _c !== void 0 ? _c : '' }));
    }
    return configs;
};
exports.logger = (project) => pino_1.default({ level: 'error', prettyPrint: true }, pino_1.default.destination({ dest: project.getRootDirectories()[0].getPath() + '/.typerpc/error.log', sync: false }));
exports.format = (path, formatter, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
onError, onComplete) => child_process_1.exec(`${formatter} ${path}`, (error, stdout, stderr) => {
    if (error) {
        onError(error);
        return;
    }
    if (stderr) {
        onError(stderr);
        return;
    }
    onComplete(`code formatting succeeded using formatter: ${formatter}, msg: ${stdout}`);
});
//# sourceMappingURL=utils.js.map