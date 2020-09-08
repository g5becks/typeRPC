import { Code, TypeRpcPlugin } from '@typerpc/plugin'
import { Command, flags } from '@oclif/command'
import { outputFile, pathExists } from 'fs-extra'
import path from 'path'
import { Listr } from 'listr2'
import { buildSchemas, Schema, validateSchemas } from '@typerpc/schema'
import { Project, SourceFile } from 'ts-morph'
import { PluginManager } from '@typerpc/plugin-manager'
import { getConfigFile, parseConfig, ParsedConfig } from '../configParser'

// validate the output path is not empty
const validateOutputPath = (outputPath: string, cfgName: string): void => {
    if (outputPath === '') {
        throw new Error(`error: no output path provided for cfg: ${cfgName}`)
    }
}

// validate the tsConfig file exists
const tsconfigFileExists = (filePath: string): Promise<boolean> => {
    return pathExists(filePath)
}

// ensure that the path to tsconfig.json actually exists
const validateTsConfigFile = async (tsConfigFile: string): Promise<void> => {
    const exists = await tsconfigFileExists(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
        throw new Error(`No tsConfig.json file found at ${tsConfigFile}`)
    }
}

type Ctx = {
    schemaFiles: SourceFile[]
    configs: ParsedConfig[]
}

type BuildCtx = { builder?: TypeRpcPlugin } & Ctx

class Build extends Command {
    static description = 'describe command here'

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
            char: 'p',
            name: 'package',
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
            this.log(`error occurred writing files: ${error}`)
            throw error
        }
    }
    #configFile: SourceFile | undefined
    #pluginManager: PluginManager = new PluginManager({ pluginsPath, ignoredDependencies: [new RegExp('[sS]*')] })
    #validationCtx: Ctx = {
        configs: [],
        schemaFiles: [],
    }

    #buildCtx: BuildCtx = { ...this.#validationCtx }

    #code: Code[] = []

    #validateTsConfig = new Listr<{ tsConfigFilePath: string }>(
        {
            title: 'Validating tsconfig.json file',
            task: async (ctx) => validateTsConfigFile(ctx.tsConfigFilePath),
        },
        { exitOnError: true },
    )

    #validateInputs = new Listr<Ctx>(
        [
            {
                title: 'Validating Output Path(s)',
                task: async (ctx) => {
                    return Promise.all(ctx.configs.map((cfg) => validateOutputPath(cfg.outputPath, cfg.configName)))
                },
            },
            {
                title: 'Validating Plugin(s)',
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
                title: 'Validating Schema Files',
                task: async (ctx) => {
                    const errs = validateSchemas(ctx.schemaFiles)
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

    schemas: ReadonlyArray<Schema> = []

    #build = new Listr<BuildCtx>(
        [
            {
                title: `Attempting to generate ${this.#buildCtx.lang} ${this.#buildCtx.target} code using ${
                    this.#buildCtx.framework
                } framework`,
                task: async (ctx) => {
                    if (typeof ctx.builder === 'undefined') {
                        throw new TypeError('builder not found')
                    }
                    const proj = new Project({
                        tsConfigFilePath: ctx.tsConfigFilePath,
                        skipFileDependencyResolution: true,
                    })
                    const schemas = buildSchemas(proj.getSourceFiles(), ctx.packageName)
                    this.schemas = schemas
                    this.#code = ctx.builder.build(schemas)
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
        const configFile = getConfigFile(project)
        let configs: ParsedConfig[] = typeof configFile !== 'undefined' ? parseConfig(configFile) : []
        const schemaFiles = project
            .getSourceFiles()
            .filter((file) => file.getBaseName().toLowerCase() !== '.rpc.config.ts')
        const plugin = flags.plugin?.trim()
        const outputPath = flags.output?.trim()
        const packageName = flags.packageName?.trim()
        const formatter = flags.formatter?.trim()
        // if user provides command line arguments the config file will
        // be overridden - Be sure to document this behaviour
        if (plugin && outputPath && packageName) {
            configs = [{ configName: 'flags', plugin, outputPath, packageName, formatter }]
        }

        this.#validationCtx = { schemaFiles, configs }
        this.log('Beginning input validation...')
        await this.#validateInputs.run(this.#validationCtx)
        await this.#build.run(this.#buildCtx)
        if (this.#code.length === 0) {
            this.error('no code found to save, exiting')
        } else {
            await this.writeOutput(outputPath, this.#code)
        }
        if (this.#buildCtx.builder?.format !== null && typeof this.#buildCtx.builder?.format !== 'undefined') {
            this.log('running code formatter')
            this.#buildCtx.builder.format(outputPath)
        }
        this.log(`JobId: ${jobId} complete, check ${outputPath} for generated ${target} code.`)
    }
}

export = Build
