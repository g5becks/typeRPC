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
var _writeCtx, _validateTsConfig, _validate, _build, _write, _format;
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const fs_extra_1 = require("fs-extra");
const path_1 = tslib_1.__importDefault(require("path"));
const listr2_1 = require("listr2");
const schema_1 = require("@typerpc/schema");
const ts_morph_1 = require("ts-morph");
const plugin_manager_1 = require("@typerpc/plugin-manager");
const utils_1 = require("../utils");
class Build extends command_1.Command {
    constructor() {
        super(...arguments);
        _writeCtx.set(this, []);
        _validateTsConfig.set(this, new listr2_1.Listr({
            title: 'tsconfig.json Validation',
            task: async (ctx) => this.validateTsConfigFile(ctx.tsConfigFilePath),
        }, { exitOnError: true }));
        _validate.set(this, new listr2_1.Listr([
            {
                title: 'Output Path(s) Validation',
                task: async (ctx) => {
                    return Promise.all(ctx.configs.map((cfg) => this.validateOutputPath(cfg.outputPath, cfg.configName)));
                },
            },
            {
                title: 'Plugin(s) Validation',
                task: async (ctx) => {
                    let invalids = [];
                    for (const cfg of ctx.configs) {
                        if (!cfg.plugin.startsWith('@typerpc/') && !cfg.plugin.startsWith('typerpc-plugin-')) {
                            invalids = [...invalids, cfg.plugin];
                        }
                    }
                    if (invalids.length !== 0) {
                        this.error(`the following plugin names are not valid typerpc plugins ${invalids}`);
                    }
                    return true;
                },
            },
            {
                title: 'Schema File(s) Validation',
                task: async (ctx) => {
                    const errs = schema_1.validateSchemas(ctx.sourceFiles);
                    if (errs.length === 0) {
                        return true;
                    }
                    this.error(errs.reduce((err, val) => {
                        var _a;
                        err.name.concat(val.name + '\n');
                        err.message.concat(val.message + '\n');
                        (_a = err.stack) === null || _a === void 0 ? void 0 : _a.concat(val.stack + '\n');
                        return err;
                    }));
                },
            },
        ], { exitOnError: true }));
        _build.set(this, new listr2_1.Listr([
            {
                title: `Installing required plugin(s)`,
                task: async (ctx) => {
                    const onError = (error) => {
                        ctx.logger.error(error);
                        this.error(error);
                    };
                    const onInstalled = (plugin) => this.log(`${plugin} already installed, fetching from cache`);
                    const onInstalling = (plugin) => this.log(`attempting to install ${plugin} from https://registry.npmjs.org`);
                    const plugins = ctx.configs.map((cfg) => cfg.plugin);
                    await ctx.manager.install(plugins, onError, onInstalled, onInstalling);
                },
            },
            {
                title: `Running code generator(s)`,
                task: async (ctx) => {
                    for (const cfg of ctx.configs) {
                        const schemas = schema_1.buildSchemas(ctx.sourceFiles, cfg.packageName);
                        const gen = ctx.manager.require(cfg.plugin);
                        if (plugin_manager_1.isValidPlugin(gen)) {
                            // pass the generated code to the writeCtx for write task
                            tslib_1.__classPrivateFieldSet(this, _writeCtx, [...tslib_1.__classPrivateFieldGet(this, _writeCtx), { code: gen(schemas), outputPath: cfg.outputPath }]);
                        }
                        else {
                            ctx.logger.error(`${cfg.plugin} is not a valid typerpc plugin`);
                            this.error(`${cfg.plugin} is not a valid typerpc plugin`);
                        }
                    }
                },
            },
        ], { exitOnError: true }));
        _write.set(this, new listr2_1.Listr([
            {
                title: 'Saving generated code to provided output path(s)',
                task: async (ctx) => {
                    await Promise.all(ctx.map((generated) => this.writeOutput(generated.outputPath, generated.code)));
                },
            },
        ], { exitOnError: true }));
        _format.set(this, new listr2_1.Listr([
            {
                title: 'Formatting Generated Code',
                task: async (ctx) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const onError = (error) => {
                        var _a;
                        (_a = ctx.logger) === null || _a === void 0 ? void 0 : _a.error(error);
                        this.error(error);
                    };
                    const onComplete = (msg) => this.log(msg);
                    await Promise.all(ctx.formatters.map(async (fmt) => fmt.formatter
                        ? utils_1.format(fmt.outputPath, fmt.formatter, onError, onComplete)
                        : this.log(`no formatter provided for formatting code in ${fmt.outputPath}`)));
                },
            },
        ], { exitOnError: true }));
    }
    async writeOutput(outputPath, code) {
        const results = [];
        const filePath = (file) => path_1.default.join(outputPath, file);
        for (const entry of code) {
            results.push(fs_extra_1.outputFile(filePath(entry.fileName), entry.source));
        }
        try {
            this.log(`saving generated code to ${outputPath}`);
            await Promise.all(results);
        }
        catch (error) {
            this.error(`error occurred writing files: ${error}`);
        }
    }
    // ensure the output path is not empty
    validateOutputPath(outputPath, cfgName) {
        if (outputPath === '') {
            this.error(`error: no output path provided for cfg: ${cfgName}`);
        }
    }
    // ensure that the path to tsconfig.json actually exists
    async validateTsConfigFile(tsConfigFile) {
        const exists = await fs_extra_1.pathExists(tsConfigFile);
        if (tsConfigFile === '' || !exists) {
            this.error(`No tsConfig.json file found at ${tsConfigFile}`);
        }
    }
    async run() {
        var _a, _b, _c, _d, _e, _f;
        const { flags } = this.parse(Build);
        const tsConfigFilePath = (_b = (_a = flags.tsConfig) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        // validate tsconfig before proceeding
        await tslib_1.__classPrivateFieldGet(this, _validateTsConfig).run({ tsConfigFilePath });
        const project = new ts_morph_1.Project({ tsConfigFilePath, skipFileDependencyResolution: true });
        // get .rpc.config.ts file
        const configFile = utils_1.getConfigFile(project);
        // parse config objects
        let configs = typeof configFile !== 'undefined' ? utils_1.parseConfig(configFile) : [];
        // filter out .rpc.config.ts file from project source files
        const sourceFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== '.rpc.config.ts');
        // parse command line flags
        const plugin = (_c = flags.plugin) === null || _c === void 0 ? void 0 : _c.trim();
        const outputPath = (_d = flags.output) === null || _d === void 0 ? void 0 : _d.trim();
        const packageName = (_e = flags.packageName) === null || _e === void 0 ? void 0 : _e.trim();
        const formatter = (_f = flags.formatter) === null || _f === void 0 ? void 0 : _f.trim();
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if (plugin && outputPath && packageName) {
            configs = [{ configName: 'flags', plugin, outputPath, packageName, formatter }];
        }
        const log = utils_1.logger(project);
        const steps = [
            { task: tslib_1.__classPrivateFieldGet(this, _validate), ctx: { sourceFiles, configs }, msg: 'Triggering input validation' },
            {
                task: tslib_1.__classPrivateFieldGet(this, _build),
                ctx: { sourceFiles, configs, manager: plugin_manager_1.PluginManager.create(project), logger: log },
                msg: 'Initializing build process',
            },
            { task: tslib_1.__classPrivateFieldGet(this, _write), ctx: tslib_1.__classPrivateFieldGet(this, _writeCtx), msg: 'Saving generated code to disk' },
            {
                task: tslib_1.__classPrivateFieldGet(this, _format),
                ctx: {
                    logger: log,
                    formatters: configs.map((cfg) => {
                        return { outputPath: cfg.outputPath, formatter: cfg.formatter };
                    }),
                },
                msg: 'Invoking Formatter(s)',
            },
        ];
        for (const step of steps) {
            this.log(step.msg);
            await step.task.run(step.ctx);
        }
    }
}
_writeCtx = new WeakMap(), _validateTsConfig = new WeakMap(), _validate = new WeakMap(), _build = new WeakMap(), _write = new WeakMap(), _format = new WeakMap();
Build.description = 'build generates rpc code using provided plugin(s)';
Build.flags = {
    help: command_1.flags.help({ char: 'h' }),
    // flag with a value (-n, --name=VALUE)
    tsConfig: command_1.flags.string({
        char: 't',
        name: 'tsconfig',
        description: 'path to tsconfig.json for project containing your typerpc schema files',
        required: true,
    }),
    output: command_1.flags.string({
        char: 'o',
        name: 'output',
        description: 'path to a directory to place generated code',
    }),
    plugin: command_1.flags.string({
        char: 'p',
        name: 'plugin',
        description: 'name of the typerpc plugin to use for code generation',
    }),
    formatter: command_1.flags.string({
        char: 'f',
        name: 'formatter',
        description: 'a command that will be executed on generated code for formatting',
    }),
    packageName: command_1.flags.string({
        name: 'pkg',
        description: 'package name to use when generating code',
    }),
};
module.exports = Build;
//# sourceMappingURL=build.js.map