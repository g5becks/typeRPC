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

import { CommandModule } from 'yargs'
import { Logger } from 'tslog'
import { isValidPlugin, PluginManager } from '@typerpc/plugin-manager'
import { Code } from '@typerpc/plugin'
import { Project, SourceFile } from 'ts-morph'
import { createLogger, format as formatter, getConfigFile, getRpcConfigPath, parseConfig, ParsedConfig } from './utils'
import { outputFile, pathExistsSync } from 'fs-extra'
import { buildSchemas, validateSchemas } from '@typerpc/schema'
import path from 'path'
import ora from 'ora'
import chalk from 'chalk'
import { readFileSync } from 'fs'
import Debug from 'debug'
const debug = Debug('@typerpc/cli.gen')

// ensure that the path to tsconfig.json actually exists
const validateTsConfigFile = (tsConfigFile: string): void => {
    const spinner = ora({ text: chalk.magenta("Let's validate your tsconfig.json path"), color: 'cyan' }).start()
    const exists = pathExistsSync(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
        spinner.fail(
            chalk.red(
                `Looks like you provided an invalid tsconfig.json file. No sweat, make sure ${tsConfigFile} exists and try again`,
            ),
        )
        throw new Error(`No tsConfig.json file found at ${tsConfigFile}`)
    }
    spinner.succeed(chalk.magenta('Great, your tsconfig file is legit!'))
}

// ensure the output path is not empty
const validateOutputPaths = (configs: ParsedConfig[]): void => {
    const spinner = ora({
        text: chalk.cyan("I'll need to check out your output path(s) as well"),
        color: 'magenta',
    }).start()
    for (const cfg of configs) {
        if (cfg.out === '') {
            spinner.fail(chalk.red(`Whoops, looks like ${cfg.configName} has an empty out field`))
            throw new Error(`${cfg.configName} has an empty out field`)
        }
    }
    spinner.succeed(chalk.cyan('Woohoo, your output path(s) look good too!'))
}

const validatePlugins = (configs: ParsedConfig[]): void => {
    const spinner = ora({
        text: chalk.whiteBright("Afraid I'm gonna have verify those plugins while I'm at it"),
        color: 'yellow',
    }).start()
    let invalids: string[] = []
    for (const cfg of configs) {
        if (!cfg.plugin.name.startsWith('@typerpc/') && !cfg.plugin.name.startsWith('typerpc-plugin')) {
            invalids = [...invalids, cfg.plugin.name]
        }
    }
    if (invalids.length !== 0) {
        spinner.fail(chalk.red(`Uh Oh, the following plugin names are not valid typerpc plugins ${invalids}`))
        throw new Error(`the following plugin names are not valid typerpc plugins ${invalids}`)
    }
    spinner.succeed(chalk.whiteBright("Valid Plugins as well, You're on you're way!"))
}

const validateSchemaFiles = (files: SourceFile[]) => {
    const spinner = ora({
        text: "One last check, let make sure you're schema files don't contain any errors",
        color: 'white',
    }).start()
    const errs = validateSchemas(files)
    if (errs.length === 0) {
        spinner.succeed("All systems are go, Let's generate some code!")
        return
    }
    spinner.fail(chalk.red(`Bummer, looks like we've spotter errors in you schema files`))
    throw errs.reduce((err, val) => {
        err.name.concat(val.name + '\n')
        err.message.concat(val.message + '\n')
        err.stack?.concat(val.stack + '\n')
        return err
    })
}

const installPlugins = async (configs: ParsedConfig[], manager: PluginManager, log: Logger) => {
    const plugins = configs.map((cfg) => cfg.plugin)
    const onInstalled = (plugin: string) => log.info(`${plugin} already installed, fetching from cache`)
    const onInstalling = (plugin: string) => log.info(`attempting to install ${plugin} `)
    await manager.install(plugins, onInstalled, onInstalling)
}

type GeneratedCode = { code: Code[]; outputPath: string }

const generateCode = (configs: ParsedConfig[], manager: PluginManager, files: SourceFile[]): GeneratedCode[] => {
    const spinner = ora({ text: chalk.whiteBright('Lift Off! Code generation has begun!'), color: 'black' })
    let generated: GeneratedCode[] = []
    for (const cfg of configs) {
        const schemas = buildSchemas(files, cfg.pkg)
        const gen = manager.require(cfg.plugin.name)
        if (gen instanceof Error) {
            throw Error(`error is ${gen.message}`)
        }
        if (isValidPlugin(gen)) {
            generated = [...generated, { code: gen(schemas), outputPath: cfg.out }]
        } else {
            spinner.fail(
                chalk.red(
                    `Wait just a second there, are you sure ${cfg.plugin.name} is an authentic @typerpc plugin? Looks like a knockoff to me`,
                ),
            )
            throw new Error(
                `${cfg.plugin.name} is not a valid typerpc plugin. Plugins must be functions, typeof ${
                    cfg.plugin.name
                } = ${typeof gen}`,
            )
        }
    }
    spinner.succeed(chalk.whiteBright('Code generation complete. That was fast!'))
    return generated
}

const saveToDisk = async (generated: GeneratedCode[], configFilePath?: string) => {
    const spinner = ora({ text: chalk.cyanBright("Let's stash this code somewhere safe."), color: 'magenta' })
    if (generated.length === 0) {
        return
    }
    const filePath = (out: string, file: string, isAbsolute: boolean) => {
        // if path is absolute, make filepath relative to that path and return it
        if (isAbsolute) {
            return path.join(out, file)
        }
        // if config file was used, make the out dir relative to the config file
        // and store the path there, otherwise use cwd
        return configFilePath ? path.join(configFilePath, out, file) : path.join(out, file)
    }
    for (const gen of generated) {
        for (const entry of gen.code) {
            try {
                await outputFile(
                    filePath(gen.outputPath, entry.fileName, path.isAbsolute(gen.outputPath)),
                    entry.source,
                )
            } catch (error) {
                spinner.fail(chalk.red(``))
                throw new Error(`error occurred writing files: ${error}`)
            }
        }
    }
    spinner.succeed(chalk.cyanBright('Alllrighty then! Your code has been saved!'))
}

type FormatConfig = {
    fmt?: string
    out: string
}

const format = (formatters: FormatConfig[], log: Logger, configFilePath?: string) => {
    const spinner = ora({
        text: chalk.magentaBright("Let's make that code look good by applying some formatting"),
        color: 'cyan',
    })
    const filePath = (dir: string, isAbsolute: boolean) => {
        // if absolute path, just return it
        if (isAbsolute) {
            return dir
        }
        // if there is a config file make the output path relative to the config file path
        return configFilePath ? path.join(configFilePath, dir) : dir
    }
    for (const fmt of formatters) {
        if (fmt.fmt) {
            formatter(
                filePath(fmt.out, path.isAbsolute(fmt.out)),
                fmt.fmt,
                (error) => log.error(error),
                (msg) => log.info(msg),
            )
        } else {
            log.warn(`No code formatter provided for code saved to ${fmt.out} your code might not look very good.`)
        }
    }
    spinner.succeed(
        chalk.cyanBright(
            "All done! If you've enjoyed using @typerpc do us a favor, visit https://github.com/typerpc/typerpc and star the project. Happy Hacking!",
        ),
    )
}

type DebugInfo = {
    pluginManagerOpts: string
    tsconfigFileData: string
    rpcConfigData?: string
    cmdLineArgs: string
}

type Args = Readonly<
    Partial<{
        tsconfig: string
        plugin: string
        local: string
        github: string
        version: string
        out: string
        pkg: string
        fmt: string
    }>
>

const createDebugInfo = (pluginManager: PluginManager, rpcConfig: SourceFile | undefined, args: Args): DebugInfo => {
    const tsconfigFile = readFileSync(args.tsconfig ?? '')
    return {
        cmdLineArgs: JSON.stringify(args),
        tsconfigFileData: tsconfigFile.toString(),
        rpcConfigData: rpcConfig?.getText(),
        pluginManagerOpts: pluginManager.opts(),
    }
}

const handler = async (args: Args): Promise<void> => {
    const { tsconfig, plugin, local, github, version, out, pkg, fmt } = args
    if (github && local) {
        throw new Error(`local and github plugin location set. Only one plugin location can used.`)
    }
    const tsConfigFilePath = tsconfig?.trim() ?? ''
    // validate tsconfig before proceeding
    validateTsConfigFile(tsconfig?.trim() ?? '')
    // create project
    const project = new Project({ tsConfigFilePath, skipFileDependencyResolution: true })
    let debugInfo: DebugInfo | undefined = undefined
    const log = createLogger(project)
    try {
        // get rpc.config.ts file
        const configFile = getConfigFile(project)
        // get rpc.config.ts filepath to use for generating code
        const configFilePath = getRpcConfigPath(configFile)
        // parse config objects
        let configs: ParsedConfig[] = configFile ? parseConfig(configFile) : []

        const pluginManager = PluginManager.create(project)
        // filter out rpc.config.ts file location project source files
        const sourceFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== 'rpc.config.ts')
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if ((local || github) && out && pkg) {
            configs = [
                {
                    configName: 'flags',
                    plugin: {
                        name: plugin ?? '',
                        location: local ? { local } : github ? { github } : 'npm',
                        version: version ?? 'latest',
                    },
                    out,
                    pkg,
                    fmt,
                },
            ]
        }
        debugInfo = createDebugInfo(pluginManager, configFile, args)
        // no configs in file or command line opts
        if (configs.length === 0) {
            throw new Error(`no configs found in rpc.config.ts and not enough arguments passed`)
        }

        validateOutputPaths(configs)
        validatePlugins(configs)
        validateSchemaFiles(sourceFiles)
        await installPlugins(configs, pluginManager, log)
        const generated = generateCode(configs, pluginManager, sourceFiles)
        await saveToDisk(generated, configFilePath)
        // noinspection JSDeepBugsSwappedArgs
        format(
            configs.map((cfg) => ({ fmt: cfg.fmt, out: cfg.out })),
            log,
            configFilePath,
        )
    } catch (error) {
        if (debug.enabled) {
            debug(debugInfo)
        }
        log.error(`error occurred ${error}`)
        throw error
    }
}

export const gen: CommandModule<Record<string, unknown>, Args> = {
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
            description:
                'version of the plugin to install, this flag is only valid if installing from npm. If using github, specify the version using the -g flag E.G. -g typerpc-plugin/someplugin#351396f ',
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
}
