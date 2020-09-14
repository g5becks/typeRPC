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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gen = void 0;
const tslog_1 = require("tslog");
const plugin_manager_1 = require("@typerpc/plugin-manager");
const listr2_1 = require("listr2");
const ts_morph_1 = require("ts-morph");
const utils_1 = require("./utils");
const fs_extra_1 = require("fs-extra");
const schema_1 = require("@typerpc/schema");
const path_1 = __importDefault(require("path"));
let log = new tslog_1.Logger();
const writeOutput = async (outputPath, code) => {
    const results = [];
    const filePath = (file) => path_1.default.join(outputPath, file);
    for (const entry of code) {
        results.push(fs_extra_1.outputFile(filePath(entry.fileName), entry.source));
    }
    try {
        log.info(`saving generated code to ${outputPath}`);
        await Promise.all(results);
    }
    catch (error) {
        throw new Error(`error occurred writing files: ${error}`);
    }
};
// ensure the output path is not empty
const validateOutputPath = (outputPath, cfgName) => {
    if (outputPath === '') {
        throw new Error(`error: no output path provided for cfg: ${cfgName}`);
    }
};
// ensure that the path to tsconfig.json actually exists
const validateTsConfigFile = async (tsConfigFile) => {
    const exists = await fs_extra_1.pathExists(tsConfigFile);
    if (tsConfigFile === '' || !exists) {
        throw new Error(`No tsConfig.json file found at ${tsConfigFile}`);
    }
};
const validateTsConfig = new listr2_1.Listr({
    title: 'tsconfig.json Validation',
    task: async (ctx) => validateTsConfigFile(ctx.tsConfigFilePath),
}, { exitOnError: true });
const validate = new listr2_1.Listr([
    {
        title: 'Output Path(s) Validation',
        task: async (ctx) => {
            return Promise.all(ctx.configs.map((cfg) => validateOutputPath(cfg.out, cfg.configName)));
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
                throw new Error(`the following plugin names are not valid typerpc plugins ${invalids}`);
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
            throw errs.reduce((err, val) => {
                var _a;
                err.name.concat(val.name + '\n');
                err.message.concat(val.message + '\n');
                (_a = err.stack) === null || _a === void 0 ? void 0 : _a.concat(val.stack + '\n');
                return err;
            });
        },
    },
], { exitOnError: true });
let writeCtx = [];
const build = new listr2_1.Listr([
    {
        title: `Installing required plugin(s)`,
        task: async (ctx) => {
            const onInstalled = (plugin) => log.info(`${plugin} already installed, fetching from cache`);
            const onInstalling = (plugin) => log.info(`attempting to install ${plugin} from https://registry.npmjs.org`);
            const plugins = ctx.configs.map((cfg) => cfg.plugin);
            await ctx.manager.install(plugins, onInstalled, onInstalling);
        },
    },
    {
        title: `Running code generator(s)`,
        task: async (ctx) => {
            for (const cfg of ctx.configs) {
                const schemas = schema_1.buildSchemas(ctx.sourceFiles, cfg.pkg);
                const gen = ctx.manager.require(cfg.plugin);
                if (gen instanceof Error) {
                    throw gen;
                }
                if (plugin_manager_1.isValidPlugin(gen)) {
                    // pass the generated code to the writeCtx for write task
                    writeCtx = [...writeCtx, { code: gen(schemas), outputPath: cfg.out }];
                }
                else {
                    throw new Error(`${cfg.plugin} is not a valid typerpc plugin. Plugins must be functions, typeof ${cfg.plugin} = ${typeof gen}`);
                }
            }
        },
    },
], { exitOnError: true });
const write = new listr2_1.Listr([
    {
        title: 'Saving generated code to provided output path(s)',
        task: async (ctx) => {
            await Promise.all(ctx.map((generated) => writeOutput(generated.outputPath, generated.code)));
        },
    },
], { exitOnError: true });
const format = new listr2_1.Listr([
    {
        title: 'Formatting Generated Code',
        task: async (ctx) => {
            await Promise.all(ctx.formatters.map(async (fmt) => fmt.fmt
                ? utils_1.format(fmt.out, fmt.fmt, log.error, log.info)
                : log.warn(`no formatter provided for formatting code in ${fmt.out}`)));
        },
    },
], { exitOnError: true });
const handler = async (args) => {
    var _a;
    const { tsconfig, plugin, out, pkg, fmt } = args;
    const tsConfigFilePath = (_a = tsconfig === null || tsconfig === void 0 ? void 0 : tsconfig.trim()) !== null && _a !== void 0 ? _a : '';
    // validate tsconfig before proceeding
    await validateTsConfig.run({ tsConfigFilePath });
    const project = new ts_morph_1.Project({ tsConfigFilePath, skipFileDependencyResolution: true });
    const manager = plugin_manager_1.PluginManager.create(project);
    log = await utils_1.createLogger(project);
    try {
        // get rpc.config.ts file
        const configFile = utils_1.getConfigFile(project);
        // parse config objects
        let configs = [];
        if (typeof configFile !== 'undefined') {
            configs = utils_1.parseConfig(configFile);
        }
        // filter out rpc.config.ts file from project source files
        const sourceFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== 'rpc.config.ts');
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if (plugin && out && pkg) {
            configs = [{ configName: 'flags', plugin, out, pkg, fmt }];
        }
        // no configs in file or command line opts
        if (configs.length === 0) {
            throw new Error(`no configs found in rpc.config.ts and not enough arguments passed`);
        }
        /*
        const onInstalled = (plugin: string) => log.info(`${plugin} is already installed`)
        const onInstalling = (plugin: string) => log.info(`installing ${plugin}`)
        setTimeout(async () => await manager.install(['@typerpc/ts-axios'], onInstalled, onInstalling), 4000)
         */
        const steps = [
            { task: validate, ctx: { sourceFiles, configs }, msg: 'Triggering input validation' },
            {
                task: build,
                ctx: { sourceFiles, configs, manager },
                msg: 'Initializing build process',
            },
            { task: write, ctx: writeCtx, msg: 'Saving generated code to disk' },
            {
                task: format,
                ctx: {
                    formatters: configs.map((cfg) => {
                        return { out: cfg.out, fmt: cfg.fmt };
                    }),
                },
                msg: 'Invoking Formatter(s)',
            },
        ];
        for (const step of steps) {
            log.info(step.msg);
            await step.task.run(step.ctx);
        }
    }
    catch (error) {
        log.error(`${error} + managerOpts = ${manager.opts()}`);
        throw error;
    }
};
exports.gen = {
    command: 'gen',
    describe: 'generates rpc code using provided plugin(s)',
    builder: {
        tsconfig: {
            alias: 't',
            type: 'string',
            demandOption: true,
            description: 'path to tsconfig.json for project containing your typerpc schema files',
        },
        plugin: {
            alias: 'p',
            type: 'string',
            description: 'name of the typerpc plugin to use for code generation',
        },
        out: {
            alias: 'o',
            type: 'string',
            description: 'path to a directory to place generated code',
        },
        pkg: {
            type: 'string',
            description: 'package name to use when generating code',
        },
        fmt: {
            alias: 'f',
            type: 'string',
            description: 'package name to use when generating code',
        },
    },
    handler,
};
//# sourceMappingURL=gen.js.map