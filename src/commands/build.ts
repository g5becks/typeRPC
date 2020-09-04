import {builders, Code, CodeBuilderPlugin, isValidLang, languages, ProgrammingLanguage, Target} from '../builders'
import {Command, flags} from '@oclif/command'
import {outputFile, pathExists} from 'fs-extra'
import {nanoid} from 'nanoid'
import path from 'path'
import {Listr} from 'listr2'
import {buildSchemas, Schema, validateSchemas} from '../schema'
import {Project} from 'ts-morph'

const isTarget = (target: string): target is Target => ['client', 'server'].includes(target)

// validate the output path is not empty
const  validateOutputPath = (outputPath: string): void => {
  if (outputPath === '') {
    throw new Error('error: no output path provided')
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

// get all builders that match the target and programming language
const getBuilders = (target: Target, lang: ProgrammingLanguage): CodeBuilderPlugin[] => {
  return builders.filter(builder =>
    builder.lang === lang && builder.target
  )
}

// find a build that matches the framework
const filterBuilderByFramework = (framework: string, builders: CodeBuilderPlugin[]): CodeBuilderPlugin[] => {
  return builders.filter(builder => builder.framework === framework)
}

// report available frameworks for target language
const reportAvailableFrameworks =  (builders: CodeBuilderPlugin[]): string[] => {
  return builders.map(builder => builder.framework)
}

type Ctx = {
  target: string;
  tsConfigFilePath: string;
  outputPath: string;
  lang: string;
  framework: string;
  packageName: string;
}

type BuildCtx = {builder?: CodeBuilderPlugin} & Ctx

class Build extends Command {
  static description = 'describe command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for project containing your typerpc schema files', required: true}),
    output: flags.string({char: 'o', name: 'output', description: 'path to a directory to place generated code', required: true}),
    lang: flags.string({char: 'l', name: 'lang', description: 'the programming language to use for generating code', required: true}),
    framework: flags.string({char: 'f', name: 'framework', description: 'the framework to use for generating code', required: true}),
    packageName: flags.string({char: 'p', name: 'package', description: 'package name to use when generating code'}),
  }

  static args = [
    {
      name: 'target',
      required: true,
      description: 'target platform for code generation',
      options: ['client', 'server'],
    },
  ]

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

  #validationCtx: Ctx = {
    target: '',
    lang: '',
    framework: '',
    outputPath: '',
    tsConfigFilePath: '',
    packageName: '',
  }

  #buildCtx: BuildCtx =  {...this.#validationCtx}

  #code: Code[] = []

  #validateInputs = new Listr<Ctx>(
    [
      {
        title: 'Validating tsconfig.json',
        task: async ctx => validateTsConfigFile(ctx.tsConfigFilePath),
      },
      {
        title: 'Validating Target',
        task: async ctx => {
          if (isTarget(ctx.target)) {
            return true
          }
          throw new Error(`invalid target: ${ctx.target}.
          valid targets are: [client, server]`)
        },

      },
      {
        title: 'Validating Programming Language',
        task: async ctx => {
          if (!isValidLang(ctx.lang)) {
            throw new Error(`${ctx.lang} is not a valid programming language selection
        valid languages are ${languages}`)
          }
        },
      },
      {
        title: 'Validating Output Path',
        task: async ctx => validateOutputPath(ctx.outputPath),
      },
      {
        title: 'Validating Framework',
        task: ctx =>  {
          const builders = getBuilders(ctx.target as Target, ctx.lang as ProgrammingLanguage)
          if (builders.length === 0) {
            this.error(`no ${ctx.target} builders were found for ${ctx.lang}`)
          }
          const filtered = filterBuilderByFramework(ctx.framework, builders)
          if (filtered.length === 0) {
            this.error(`no ${ctx.target} builder found for ${ctx.lang} using ${ctx.framework}. Available ${ctx.target} builders for ${ctx.lang} are ${reportAvailableFrameworks(builders)}`)
          } else {
            this.#buildCtx = {
              ...ctx,
              builder: filtered[0],
            }
          }
        },
      },
      {
        title: 'Validating Schema Files',
        task: async ctx => {
          const project = new Project({tsConfigFilePath: ctx.tsConfigFilePath, skipFileDependencyResolution: true})
          const errs = validateSchemas(project.getSourceFiles())
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
    ], {exitOnError: true})

  schemas: ReadonlyArray<Schema> = []

  #build = new Listr<BuildCtx>([
    {
      title: `Attempting to generate ${this.#buildCtx.lang} ${this.#buildCtx.target} code using ${this.#buildCtx.framework} framework`,
      task: async ctx => {
        if (typeof ctx.builder === 'undefined') {
          throw  new TypeError('builder not found')
        }
        const proj = new Project({tsConfigFilePath: ctx.tsConfigFilePath, skipFileDependencyResolution: true})
        const schemas = buildSchemas(proj.getSourceFiles(), ctx.packageName)
        this.schemas = schemas
        this.#code = ctx.builder.build(schemas)
      },
    },
  ], {exitOnError: true})

  async run() {
    const {args, flags} = this.parse(Build)
    const target = args.target.trim()
    const tsConfigFilePath = flags.tsConfig?.trim() ?? ''
    const outputPath = flags.output?.trim() ?? ''
    const lang = flags.lang?.trim() ?? ''
    const packageName = flags.packageName?.trim() ?? ''
    const framework = flags.framework?.trim() ?? ''
    const jobId = nanoid().toLowerCase()
    this.#validationCtx = {target, tsConfigFilePath, outputPath, framework, lang, packageName}
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
