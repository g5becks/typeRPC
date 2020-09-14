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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.createLogger = exports.parseConfig = exports.getConfigFile = void 0;
const ts_morph_1 = require("ts-morph");
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const tslog_1 = require("tslog");
const prettyjson_1 = require("prettyjson");
const fs = __importStar(require("fs-extra"));
exports.getConfigFile = (project) => project.getSourceFile((file) => file.getBaseName().toLowerCase() === 'rpc.config.ts');
const parseGeneratorConfig = (obj) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const out = (_c = (_b = (_a = obj.getProperty('out')) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _b === void 0 ? void 0 : _b.getLiteralValue()) === null || _c === void 0 ? void 0 : _c.trim();
    const plugin = (_f = (_e = (_d = obj.getProperty('plugin')) === null || _d === void 0 ? void 0 : _d.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _e === void 0 ? void 0 : _e.getLiteralValue()) === null || _f === void 0 ? void 0 : _f.trim();
    const pkg = (_j = (_h = (_g = obj.getProperty('pkg')) === null || _g === void 0 ? void 0 : _g.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _h === void 0 ? void 0 : _h.getLiteralValue()) === null || _j === void 0 ? void 0 : _j.trim();
    const fmt = (_m = (_l = (_k = obj.getProperty('fmt')) === null || _k === void 0 ? void 0 : _k.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _l === void 0 ? void 0 : _l.getLiteralValue()) === null || _m === void 0 ? void 0 : _m.trim();
    console.log(`outputpath = ${out}, plugin = ${plugin}, package = ${pkg}`);
    if (!out || !plugin || !pkg) {
        throw new Error(`
        error in config file: ${obj.getSourceFile().getFilePath()},
        at line number: ${obj.getStartLineNumber()},
        message: all generator config objects must contain the following properties: [outputPath, plugin, packageName]`);
    }
    return { out, plugin, pkg, fmt };
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
exports.createLogger = async (project) => {
    const dest = project.getRootDirectories()[0].getPath() + '/.typerpc/error.log';
    await fs.ensureFile(dest);
    const logToFile = (logObject) => {
        fs_extra_1.appendFile(dest, prettyjson_1.render(logObject) + '\n\n');
    };
    const logger = new tslog_1.Logger({ type: 'pretty' });
    logger.attachTransport({
        silly: logger.silly,
        debug: logger.debug,
        trace: logger.trace,
        info: logger.info,
        warn: logger.warn,
        error: logToFile,
        fatal: logToFile,
    }, 'error');
    return logger;
};
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