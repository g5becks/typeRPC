/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Code } from '@typerpc/plugin'
import { Command, flags } from '@oclif/command'
import { outputFile, pathExists } from 'fs-extra'
import path from 'path'
import { Listr } from 'listr2'
import { buildSchemas, validateSchemas } from '@typerpc/schema'
import { Project, SourceFile } from 'ts-morph'
import { isValidPlugin, PluginManager } from '@typerpc/plugin-manager'
import { BaseLogger } from 'pino'
import { format, getConfigFile, logger, parseConfig, ParsedConfig } from '../utils'

type ValidateCtx = {
    sourceFiles: SourceFile[]
    configs: ParsedConfig[]
}

type BuildCtx = { manager: PluginManager; logger: BaseLogger } & ValidateCtx

type GeneratedCode = { code: Code[]; outputPath: string }

type WriteCtx = GeneratedCode[]

type FormatConfig = {
    formatter?: string
    outputPath: string
}
type FormatCtx = { logger: BaseLogger; formatters: FormatConfig[] }

type TaskCtx = ValidateCtx | BuildCtx | WriteCtx | FormatCtx

type BuildStep = {
    task: Listr
    ctx: TaskCtx
    msg: string
}

class Build extends Command {
    static description = 'build generates rpc code using provided plugin(s)'

    static flags = {
        help: flags.help({ char: 'h' }),
        // flag with a value (-n, --name=VALUE)
        tsConfig: flags.string({
            char: 't',
            name: 'tsconfig',
            description: 'path to tsconfig.json for project containing your typerpc schema files',
            required: true,
        }),
        output: flags.string({
            char: 'o',
            name: 'output',
            description: 'path to a directory to place generated code',
        }),
        plugin: flags.string({
            char: 'p',
            name: 'plugin',
            description: 'name of the typerpc plugin to use for code generation',
        }),
        formatter: flags.string({
            char: 'f',
            name: 'formatter',
            description: 'a command that will be executed on generated code for formatting',
        }),
        packageName: flags.string({
            name: 'pkg',
            description: 'package name to use when generating code',
        }),
    }

    async writeOutput(outputPath: string, code: Code[]): Promise<void> {
        const results = []
        const filePath = (file: string) => path.join(outputPath, file)
        for (const entry of code) {
            results.push(outputFile(filePath(entry.fileName), entry.source))
        }

        try {
            this.log(`saving generated code to ${outputPath}`)
            await Promise.all(results)
        } catch (error) {
            this.error(`error occurred writing files: ${error}`)
        }
    }

    // ensure the output path is not empty
    validateOutputPath(outputPath: string, cfgName: string): void {
        if (outputPath === '') {
            this.error(`error: no output path provided for cfg: ${cfgName}`)
        }
    }

    // ensure that the path to tsconfig.json actually exists
    async validateTsConfigFile(tsConfigFile: string): Promise<void> {
        const exists = await pathExists(tsConfigFile)
        if (tsConfigFile === '' || !exists) {
            this.error(`No tsConfig.json file found at ${tsConfigFile}`)
        }
    }

    #writeCtx: WriteCtx = []

    #validateTsConfig = new Listr<{ tsConfigFilePath: string }>(
        {
            title: 'tsconfig.json Validation',
            task: async (ctx) => this.validateTsConfigFile(ctx.tsConfigFilePath),
        },
        { exitOnError: true },
    )

    #validate = new Listr<ValidateCtx>(
        [
            {
                title: 'Output Path(s) Validation',
                task: async (ctx) => {
                    return Promise.all(
                        ctx.configs.map((cfg) => this.validateOutputPath(cfg.outputPath, cfg.configName)),
                    )
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
                        this.error(`the following plugin names are not valid typerpc plugins ${invalids}`)
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
                    this.error(
                        errs.reduce((err, val) => {
                            err.name.concat(val.name + '\n')
                            err.message.concat(val.message + '\n')
                            err.stack?.concat(val.stack + '\n')
                            return err
                        }),
                    )
                },
            },
        ],
        { exitOnError: true },
    )

    #build = new Listr<BuildCtx>(
        [
            {
                title: `Installing required plugin(s)`,
                task: async (ctx) => {
                    const onError = (error: Error) => {
                        ctx.logger.error(error)
                        this.error(error)
                    }
                    const onInstalled = (plugin: string) => this.log(`${plugin} already installed, fetching from cache`)
                    const onInstalling = (plugin: string) =>
                        this.log(`attempting to install ${plugin} from https://registry.npmjs.org`)
                    const plugins = ctx.configs.map((cfg) => cfg.plugin)
                    await ctx.manager.install(plugins, onError, onInstalled, onInstalling)
                },
            },
            {
                title: `Running code generator(s)`,
                task: async (ctx) => {
                    for (const cfg of ctx.configs) {
                        const schemas = buildSchemas(ctx.sourceFiles, cfg.packageName)
                        const plugin = ctx.manager.require(cfg.plugin)
                        if (isValidPlugin(plugin)) {
                            this.#writeCtx = [
                                ...this.#writeCtx,
                                { code: plugin.generate(schemas), outputPath: cfg.outputPath },
                            ]
                        } else {
                            ctx.logger.error(`${cfg.plugin} is not a valid typerpc plugin`)
                            this.error(`${cfg.plugin} is not a valid typerpc plugin`)
                        }
                    }
                },
            },
        ],
        { exitOnError: true },
    )

    #write = new Listr<WriteCtx>(
        [
            {
                title: 'Saving generated code to provided output path(s)',
                task: async (ctx) => {
                    await Promise.all(ctx.map((generated) => this.writeOutput(generated.outputPath, generated.code)))
                },
            },
        ],
        { exitOnError: true },
    )

    #format = new Listr<FormatCtx>(
        [
            {
                title: 'Formatting Generated Code',
                task: async (ctx) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const onError = (error: any) => {
                        ctx.logger?.error(error)
                        this.error(error)
                    }
                    const onComplete = (msg: string) => this.log(msg)
                    await Promise.all(
                        ctx.formatters.map(async (fmt) =>
                            fmt.formatter
                                ? format(fmt.outputPath, fmt.formatter, onError, onComplete)
                                : this.log(`no formatter provided for formatting code in ${fmt.outputPath}`),
                        ),
                    )
                },
            },
        ],
        { exitOnError: true },
    )
    async run() {
        const { flags } = this.parse(Build)
        const tsConfigFilePath = flags.tsConfig?.trim() ?? ''
        // validate tsconfig before proceeding
        await this.#validateTsConfig.run({ tsConfigFilePath })
        const project = new Project({ tsConfigFilePath, skipFileDependencyResolution: true })
        // get .rpc.config.ts file
        const configFile = getConfigFile(project)
        // parse config objects
        let configs: ParsedConfig[] = typeof configFile !== 'undefined' ? parseConfig(configFile) : []
        // filter out .rpc.config.ts file from project source files
        const sourceFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== '.rpc.config.ts')
        // parse command line flags
        const plugin = flags.plugin?.trim()
        const outputPath = flags.output?.trim()
        const packageName = flags.packageName?.trim()
        const formatter = flags.formatter?.trim()
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if (plugin && outputPath && packageName) {
            configs = [{ configName: 'flags', plugin, outputPath, packageName, formatter }]
        }

        const log = logger(project)
        const steps: BuildStep[] = [
            { task: this.#validate, ctx: { sourceFiles, configs }, msg: 'Triggering input validation' },
            {
                task: this.#build,
                ctx: { sourceFiles, configs, manager: PluginManager.create(project), logger: log },
                msg: 'Initializing build process',
            },
            { task: this.#write, ctx: this.#writeCtx, msg: 'Saving generated code to disk' },
            {
                task: this.#format,
                ctx: {
                    logger: log,
                    formatters: configs.map((cfg) => {
                        return { outputPath: cfg.outputPath, formatter: cfg.formatter }
                    }),
                },
                msg: 'Invoking Formatter(s)',
            },
        ]
        for (const step of steps) {
            this.log(step.msg)
            await step.task.run(step.ctx)
        }
    }
}

export = Build
