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
const fs = __importStar(require("fs-extra"));
const fs_extra_1 = require("fs-extra");
const tslog_1 = require("tslog");
const prettyjson_1 = require("prettyjson");
exports.getConfigFile = (project) => project.getSourceFile((file) => file.getBaseName().toLowerCase() === 'rpc.config.ts');
// get the value for the PluginConfig location property
const parsePluginLocation = (pluginConfig) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // get location property
    const prop = pluginConfig === null || pluginConfig === void 0 ? void 0 : pluginConfig.getProperty('location');
    // get string if exists
    const propString = prop === null || prop === void 0 ? void 0 : prop.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral);
    // if string is npm return npm as location
    if (propString && ((_a = propString[0]) === null || _a === void 0 ? void 0 : _a.getLiteralValue().trim()) === 'npm') {
        return 'npm';
    }
    // location is not string so must be objectLiteral
    const locationObj = prop === null || prop === void 0 ? void 0 : prop.getChildrenOfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
    // make sure it is defined
    if (locationObj && locationObj.length > 0) {
        // get first objectLiteral since there is only one
        const location = locationObj[0];
        // if github property exists
        if (location.getProperty('github')) {
            // return the string found or empty, let function up the stack
            // throw when empty string is found
            return {
                github: (_e = (_d = (_c = (_b = location === null || location === void 0 ? void 0 : location.getProperty('github')) === null || _b === void 0 ? void 0 : _b.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _c === void 0 ? void 0 : _c.getLiteralValue()) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : '',
            };
        }
        if (location.getProperty('local')) {
            return {
                github: (_j = (_h = (_g = (_f = location === null || location === void 0 ? void 0 : location.getProperty('local')) === null || _f === void 0 ? void 0 : _f.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _g === void 0 ? void 0 : _g.getLiteralValue()) === null || _h === void 0 ? void 0 : _h.trim()) !== null && _j !== void 0 ? _j : '',
            };
        }
    }
    return 'npm';
};
const parseGeneratorConfig = (obj) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const out = (_c = (_b = (_a = obj.getProperty('out')) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _b === void 0 ? void 0 : _b.getLiteralValue()) === null || _c === void 0 ? void 0 : _c.trim();
    const pluginConfig = (_d = obj.getProperty('plugin')) === null || _d === void 0 ? void 0 : _d.getChildrenOfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)[0];
    const plugin = {
        name: (_h = (_g = (_f = (_e = pluginConfig === null || pluginConfig === void 0 ? void 0 : pluginConfig.getProperty('name')) === null || _e === void 0 ? void 0 : _e.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _f === void 0 ? void 0 : _f.getLiteralValue()) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : '',
        version: (_m = (_l = (_k = (_j = pluginConfig === null || pluginConfig === void 0 ? void 0 : pluginConfig.getProperty('version')) === null || _j === void 0 ? void 0 : _j.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _k === void 0 ? void 0 : _k.getLiteralValue()) === null || _l === void 0 ? void 0 : _l.trim()) !== null && _m !== void 0 ? _m : 'latest',
        location: parsePluginLocation(pluginConfig),
    };
    const pkg = (_q = (_p = (_o = obj.getProperty('pkg')) === null || _o === void 0 ? void 0 : _o.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _p === void 0 ? void 0 : _p.getLiteralValue()) === null || _q === void 0 ? void 0 : _q.trim();
    const fmt = (_t = (_s = (_r = obj.getProperty('fmt')) === null || _r === void 0 ? void 0 : _r.getChildrenOfKind(ts_morph_1.SyntaxKind.StringLiteral)[0]) === null || _s === void 0 ? void 0 : _s.getLiteralValue()) === null || _t === void 0 ? void 0 : _t.trim();
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
    // parse object literal location the config var then get all properties
    const conf = file === null || file === void 0 ? void 0 : file.getVariableDeclaration('config');
    const props = (_a = conf === null || conf === void 0 ? void 0 : conf.getFirstChildByKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.PropertyAssignment);
    // if there are no properties throw and exit
    if (typeof props === 'undefined') {
        throw new Error(`error in config file. Invalid config object, no generators found.`);
    }
    let configs = [];
    // get the Generator config for each property assignment
    // pass is to the parseGeneratorConfig function along with the
    // name of the property the config belongs to
    for (const prop of props) {
        configs = configs.concat(Object.assign(Object.assign({}, parseGeneratorConfig(prop.getChildrenOfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)[0])), { configName: (_c = (_b = prop.getFirstChild()) === null || _b === void 0 ? void 0 : _b.getText()) !== null && _c !== void 0 ? _c : '' }));
    }
    return configs;
};
exports.createLogger = (project) => {
    const dest = project.getRootDirectories()[0].getPath() + '/.typerpc/error.log';
    fs.ensureFileSync(dest);
    const logToFile = async (logObject) => {
        await fs_extra_1.appendFile(dest, prettyjson_1.render(logObject, { noColor: true }) +
            '\n---------------------------------------------------------------------------------------------------------------------------------------\n');
    };
    const logger = new tslog_1.Logger();
    logger.attachTransport({
        silly: logToFile,
        debug: logToFile,
        trace: logToFile,
        info: logToFile,
        warn: logToFile,
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