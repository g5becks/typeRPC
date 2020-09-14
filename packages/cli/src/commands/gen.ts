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
import { Listr } from 'listr2'
import { Project, SourceFile } from 'ts-morph'
import { ParsedConfig, format as formatter, createLogger, getConfigFile, parseConfig } from './utils'
import { outputFile, pathExists } from 'fs-extra'
import { buildSchemas, validateSchemas } from '@typerpc/schema'
import path from 'path'

type ValidateCtx = {
    sourceFiles: SourceFile[]
    configs: ParsedConfig[]
}

type BuildCtx = { manager: PluginManager } & ValidateCtx

type GeneratedCode = { code: Code[]; outputPath: string }

type WriteCtx = GeneratedCode[]

type FormatConfig = {
    fmt?: string
    out: string
}
type FormatCtx = { formatters: FormatConfig[] }

type TaskCtx = ValidateCtx | BuildCtx | WriteCtx | FormatCtx

type BuildStep = {
    task: Listr
    ctx: TaskCtx
    msg: string
}

type Args = Readonly<
    Partial<{
        tsconfig: string
        plugin: string
        out: string
        pkg: string
        fmt: string
    }>
>

let log: Logger = new Logger()

const writeOutput = async (outputPath: string, code: Code[]): Promise<void> => {
    const results = []
    const filePath = (file: string) => path.join(outputPath, file)
    for (const entry of code) {
        results.push(outputFile(filePath(entry.fileName), entry.source))
    }

    try {
        log.info(`saving generated code to ${outputPath}`)
        await Promise.all(results)
    } catch (error) {
        throw new Error(`error occurred writing files: ${error}`)
    }
}

// ensure the output path is not empty
const validateOutputPath = (outputPath: string, cfgName: string): void => {
    if (outputPath === '') {
        throw new Error(`error: no output path provided for cfg: ${cfgName}`)
    }
}

// ensure that the path to tsconfig.json actually exists
const validateTsConfigFile = async (tsConfigFile: string): Promise<void> => {
    const exists = await pathExists(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
        throw new Error(`No tsConfig.json file found at ${tsConfigFile}`)
    }
}

const validateTsConfig = new Listr<{ tsConfigFilePath: string }>(
    {
        title: 'tsconfig.json Validation',
        task: async (ctx) => validateTsConfigFile(ctx.tsConfigFilePath),
    },
    { exitOnError: true },
)

const validate = new Listr<ValidateCtx>(
    [
        {
            title: 'Output Path(s) Validation',
            task: async (ctx) => {
                return Promise.all(ctx.configs.map((cfg) => validateOutputPath(cfg.out, cfg.configName)))
            },
        },
        {
            title: 'Plugin(s) Validation',
            task: async (ctx) => {
                let invalids: string[] = []
                for (const cfg of ctx.configs) {
                    if (!cfg.plugin.startsWith('@typerpc/') && !cfg.plugin.startsWith('typerpc-plugin-')) {
                        invalids = [...invalids, cfg.plugin]
                    }
                }
                if (invalids.length !== 0) {
                    throw new Error(`the following plugin names are not valid typerpc plugins ${invalids}`)
                }
                return true
            },
        },
        {
            title: 'Schema File(s) Validation',
            task: async (ctx) => {
                const errs = validateSchemas(ctx.sourceFiles)
                if (errs.length === 0) {
                    return true
                }
                throw errs.reduce((err, val) => {
                    err.name.concat(val.name + '\n')
                    err.message.concat(val.message + '\n')
                    err.stack?.concat(val.stack + '\n')
                    return err
                })
            },
        },
    ],
    { exitOnError: true },
)

let writeCtx: WriteCtx = []

const build = new Listr<BuildCtx>(
    [
        {
            title: `Installing required plugin(s)`,
            task: async (ctx) => {
                const onInstalled = (plugin: string) => log.info(`${plugin} already installed, fetching from cache`)
                const onInstalling = (plugin: string) =>
                    log.info(`attempting to install ${plugin} from https://registry.npmjs.org`)
                const plugins = ctx.configs.map((cfg) => cfg.plugin)
                await ctx.manager.install(plugins, onInstalled, onInstalling)
            },
        },
        {
            title: `Running code generator(s)`,
            task: async (ctx) => {
                for (const cfg of ctx.configs) {
                    const schemas = buildSchemas(ctx.sourceFiles, cfg.pkg)
                    const gen = ctx.manager.require(cfg.plugin)
                    if (gen instanceof Error) {
                        throw Error(`error is ${gen.message}`)
                    }

                    if (isValidPlugin(gen)) {
                        // pass the generated code to the writeCtx for write task
                        writeCtx = [...writeCtx, { code: gen(schemas), outputPath: cfg.out }]
                    } else {
                        throw new Error(
                            `${cfg.plugin} is not a valid typerpc plugin. Plugins must be functions, typeof ${
                                cfg.plugin
                            } = ${typeof gen}`,
                        )
                    }
                }
            },
        },
    ],
    { exitOnError: true },
)

const write = new Listr<WriteCtx>(
    [
        {
            title: 'Saving generated code to provided output path(s)',
            task: async (ctx) => {
                await Promise.all(ctx.map((generated) => writeOutput(generated.outputPath, generated.code)))
            },
        },
    ],
    { exitOnError: true },
)

const format = new Listr<FormatCtx>(
    [
        {
            title: 'Formatting Generated Code',
            task: async (ctx) => {
                await Promise.all(
                    ctx.formatters.map(async (fmt) =>
                        fmt.fmt
                            ? formatter(fmt.out, fmt.fmt, log.error, log.info)
                            : log.warn(`no formatter provided for formatting code in ${fmt.out}`),
                    ),
                )
            },
        },
    ],
    { exitOnError: true },
)

const handler = async (args: Args): Promise<void> => {
    const { tsconfig, plugin, out, pkg, fmt } = args
    const tsConfigFilePath = tsconfig?.trim() ?? ''
    // validate tsconfig before proceeding
    await validateTsConfig.run({ tsConfigFilePath })
    const project = new Project({ tsConfigFilePath, skipFileDependencyResolution: true })
    const manager = PluginManager.create(project)
    log = await createLogger(project)

    try {
        // get rpc.config.ts file
        const configFile = getConfigFile(project)
        // parse config objects
        let configs: ParsedConfig[] = []
        if (typeof configFile !== 'undefined') {
            configs = parseConfig(configFile)
        }
        // filter out rpc.config.ts file from project source files
        const sourceFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== 'rpc.config.ts')
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if (plugin && out && pkg) {
            configs = [{ configName: 'flags', plugin, out, pkg, fmt }]
        }
        // no configs in file or command line opts
        if (configs.length === 0) {
            throw new Error(`no configs found in rpc.config.ts and not enough arguments passed`)
        }

        const onInstalled = (plugin: string) => log.info(`${plugin} is already installed`)
        const onInstalling = (plugin: string) => log.info(`installing ${plugin}`)
        setTimeout(async () => {
            await manager.install(['@typerpc/ts-axios'], onInstalled, onInstalling)
            const plug = manager.require('@typerpc/ts-axios')
            console.log(typeof plug)
        }, 4000)
        const steps: BuildStep[] = [
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
                        return { out: cfg.out, fmt: cfg.fmt }
                    }),
                },
                msg: 'Invoking Formatter(s)',
            },
        ]
        for (const step of steps) {
            log.info(step.msg)
            // await step.task.run(step.ctx)
        }
    } catch (error) {
        log.error(`${error} + managerOpts = ${manager.opts()}`)
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
}
