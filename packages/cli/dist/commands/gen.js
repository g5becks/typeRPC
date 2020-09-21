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
const plugin_manager_1 = require("@typerpc/plugin-manager");
const ts_morph_1 = require("ts-morph");
const utils_1 = require("./utils");
const fs_extra_1 = require("fs-extra");
const schema_1 = require("@typerpc/schema");
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('@typerpc/cli.gen');
// ensure that the path to tsconfig.json actually exists
const validateTsConfigFile = (tsConfigFile) => {
    const spinner = ora_1.default({ text: chalk_1.default.magenta("Let's validate your tsconfig.json path"), color: 'cyan' }).start();
    const exists = fs_extra_1.pathExistsSync(tsConfigFile);
    if (tsConfigFile === '' || !exists) {
        spinner.fail(chalk_1.default.red(`Looks like you provided an invalid tsconfig.json file. No sweat, make sure ${tsConfigFile} exists and try again`));
        throw new Error(`No tsConfig.json file found at ${tsConfigFile}`);
    }
    spinner.succeed(chalk_1.default.magenta('Great, your tsconfig file is legit!'));
};
// ensure the output path is not empty
const validateOutputPaths = (configs) => {
    const spinner = ora_1.default({
        text: chalk_1.default.cyan("I'll need to check out your output path(s) as well"),
        color: 'magenta',
    }).start();
    for (const cfg of configs) {
        if (cfg.out === '') {
            spinner.fail(chalk_1.default.red(`Whoops, looks like ${cfg.configName} has an empty out field`));
            throw new Error(`${cfg.configName} has an empty out field`);
        }
    }
    spinner.succeed(chalk_1.default.cyan('Woohoo, your output path(s) look good too!'));
};
const validatePlugins = (configs) => {
    const spinner = ora_1.default({
        text: chalk_1.default.whiteBright("Afraid I'm gonna have verify those plugins while I'm at it"),
        color: 'yellow',
    }).start();
    let invalids = [];
    for (const cfg of configs) {
        if (!cfg.plugin.name.startsWith('@typerpc/') && !cfg.plugin.name.startsWith('typerpc-plugin')) {
            invalids = [...invalids, cfg.plugin.name];
        }
    }
    if (invalids.length !== 0) {
        spinner.fail(chalk_1.default.red(`Uh Oh, the following plugin names are not valid typerpc plugins ${invalids}`));
        throw new Error(`the following plugin names are not valid typerpc plugins ${invalids}`);
    }
    spinner.succeed(chalk_1.default.whiteBright("Valid Plugins as well, You're on you're way!"));
};
const validateSchemaFiles = (files) => {
    const spinner = ora_1.default({
        text: "One last check, let make sure you're schema files don't contain any errors",
        color: 'white',
    }).start();
    const errs = schema_1.validateSchemas(files);
    if (errs.length === 0) {
        spinner.succeed("All systems are go, Let's generate some code!");
        return;
    }
    spinner.fail(chalk_1.default.red(`Bummer, looks like we've spotter errors in you schema files`));
    throw errs.reduce((err, val) => {
        var _a;
        err.name.concat(val.name + '\n');
        err.message.concat(val.message + '\n');
        (_a = err.stack) === null || _a === void 0 ? void 0 : _a.concat(val.stack + '\n');
        return err;
    });
};
const installPlugins = async (configs, manager, log) => {
    const plugins = configs.map((cfg) => cfg.plugin);
    const onInstalled = (plugin) => log.info(`${plugin} already installed, fetching from cache`);
    const onInstalling = (plugin) => log.info(`attempting to install ${plugin} `);
    await manager.install(plugins, onInstalled, onInstalling);
};
const generateCode = (configs, manager, files) => {
    const spinner = ora_1.default({ text: chalk_1.default.whiteBright('Lift Off! Code generation has begun!'), color: 'black' });
    let generated = [];
    for (const cfg of configs) {
        const schemas = schema_1.buildSchemas(files, cfg.pkg);
        const gen = manager.require(cfg.plugin.name);
        if (gen instanceof Error) {
            throw Error(`error is ${gen.message}`);
        }
        if (plugin_manager_1.isValidPlugin(gen)) {
            generated = [...generated, { code: gen(schemas), outputPath: cfg.out }];
        }
        else {
            spinner.fail(chalk_1.default.red(`Wait just a second there, are you sure ${cfg.plugin.name} is an authentic @typerpc plugin? Looks like a knockoff to me`));
            throw new Error(`${cfg.plugin.name} is not a valid typerpc plugin. Plugins must be functions, typeof ${cfg.plugin.name} = ${typeof gen}`);
        }
    }
    spinner.succeed(chalk_1.default.whiteBright('Code generation complete. That was fast!'));
    return generated;
};
const saveToDisk = async (generated, configFilePath) => {
    const spinner = ora_1.default({ text: chalk_1.default.cyanBright("Let's stash this code somewhere safe."), color: 'magenta' });
    if (generated.length === 0) {
        return;
    }
    const filePath = (out, file, isAbsolute) => {
        // if path is absolute, make filepath relative to that path and return it
        if (isAbsolute) {
            return path_1.default.join(out, file);
        }
        // if config file was used, make the out dir relative to the config file
        // and store the path there, otherwise use cwd
        return configFilePath ? path_1.default.join(configFilePath, out, file) : path_1.default.join(out, file);
    };
    for (const gen of generated) {
        for (const entry of gen.code) {
            try {
                await fs_extra_1.outputFile(filePath(gen.outputPath, entry.fileName, path_1.default.isAbsolute(gen.outputPath)), entry.source);
            }
            catch (error) {
                spinner.fail(chalk_1.default.red(``));
                throw new Error(`error occurred writing files: ${error}`);
            }
        }
    }
    spinner.succeed(chalk_1.default.cyanBright('Alllrighty then! Your code has been saved!'));
};
const format = (formatters, log, configFilePath) => {
    const spinner = ora_1.default({
        text: chalk_1.default.magentaBright("Let's make that code look good by applying some formatting"),
        color: 'cyan',
    });
    const filePath = (dir, isAbsolute) => {
        // if absolute path, just return it
        if (isAbsolute) {
            return dir;
        }
        // if there is a config file make the output path relative to the config file path
        return configFilePath ? path_1.default.join(configFilePath, dir) : dir;
    };
    for (const fmt of formatters) {
        if (fmt.fmt) {
            utils_1.format(filePath(fmt.out, path_1.default.isAbsolute(fmt.out)), fmt.fmt, (error) => log.error(error), (msg) => log.info(msg));
        }
        else {
            log.warn(`No code formatter provided for code saved to ${fmt.out} your code might not look very good.`);
        }
    }
    spinner.succeed(chalk_1.default.cyanBright("All done! If you've enjoyed using @typerpc do us a favor, visit https://github.com/typerpc/typerpc and star the project. Happy Hacking!"));
};
const createDebugInfo = (pluginManager, rpcConfig, args) => {
    var _a;
    const tsconfigFile = fs_1.readFileSync((_a = args.tsconfig) !== null && _a !== void 0 ? _a : '');
    return {
        cmdLineArgs: JSON.stringify(args),
        tsconfigFileData: tsconfigFile.toString(),
        rpcConfigData: rpcConfig === null || rpcConfig === void 0 ? void 0 : rpcConfig.getText(),
        pluginManagerOpts: pluginManager.opts(),
    };
};
const handler = async (args) => {
    var _a, _b;
    const { tsconfig, plugin, local, github, version, out, pkg, fmt } = args;
    if (github && local) {
        throw new Error(`local and github plugin location set. Only one plugin location can used.`);
    }
    const tsConfigFilePath = (_a = tsconfig === null || tsconfig === void 0 ? void 0 : tsconfig.trim()) !== null && _a !== void 0 ? _a : '';
    // validate tsconfig before proceeding
    validateTsConfigFile((_b = tsconfig === null || tsconfig === void 0 ? void 0 : tsconfig.trim()) !== null && _b !== void 0 ? _b : '');
    // create project
    const project = new ts_morph_1.Project({ tsConfigFilePath, skipFileDependencyResolution: true });
    let debugInfo = undefined;
    const log = utils_1.createLogger(project);
    try {
        // get rpc.config.ts file
        const configFile = utils_1.getConfigFile(project);
        // get rpc.config.ts filepath to use for generating code
        const configFilePath = utils_1.getRpcConfigPath(configFile);
        // parse config objects
        let configs = configFile ? utils_1.parseConfig(configFile) : [];
        const pluginManager = plugin_manager_1.PluginManager.create(project);
        // filter out rpc.config.ts file location project source files
        const sourceFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== 'rpc.config.ts');
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if ((local || github) && out && pkg) {
            configs = [
                {
                    configName: 'flags',
                    plugin: {
                        name: plugin !== null && plugin !== void 0 ? plugin : '',
                        location: local ? { local } : github ? { github } : 'npm',
                        version: version !== null && version !== void 0 ? version : 'latest',
                    },
                    out,
                    pkg,
                    fmt,
                },
            ];
        }
        debugInfo = createDebugInfo(pluginManager, configFile, args);
        // no configs in file or command line opts
        if (configs.length === 0) {
            throw new Error(`no configs found in rpc.config.ts and not enough arguments passed`);
        }
        validateOutputPaths(configs);
        validatePlugins(configs);
        validateSchemaFiles(sourceFiles);
        await installPlugins(configs, pluginManager, log);
        const generated = generateCode(configs, pluginManager, sourceFiles);
        await saveToDisk(generated, configFilePath);
        // noinspection JSDeepBugsSwappedArgs
        format(configs.map((cfg) => ({ fmt: cfg.fmt, out: cfg.out })), log, configFilePath);
    }
    catch (error) {
        if (debug.enabled) {
            debug(debugInfo);
        }
        log.error(`error occurred ${error}, stack: ${error.stack}`);
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
        github: {
            alias: 'g',
            type: 'string',
            description: `github repository to download the typerpc plugin from. specify in the format owner/repository_name or owner/repository_name#ref to specify a version E.G. typerpc-plugin/someplugin#351396f`,
        },
        plugin: {
            alias: 'p',
            type: 'string',
            description: 'name of the typerpc plugin to install and use for code generation',
        },
        local: {
            alias: 'l',
            type: 'string',
            description: `path to the directory containing the package.json file for the local plugin to install. E.G. /machine/development/plugin`,
        },
        version: {
            alias: 'v',
            type: 'string',
            description: 'version of the plugin to install, this flag is only valid if installing from npm. If using github, specify the version using the -g flag E.G. -g typerpc-plugin/someplugin#351396f ',
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