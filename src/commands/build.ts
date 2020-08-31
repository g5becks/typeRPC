import {builders, Code, CodeBuilder, ProgrammingLanguage, Target} from '../builders'
import {Command, flags} from '@oclif/command'
import {outputFile, pathExists} from 'fs-extra'
import {nanoid} from 'nanoid'
import path from 'path'
import Listr from 'listr2'
import {buildSchemas, validateSchemas} from '../schema'
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
const getBuilders = (target: Target, lang: ProgrammingLanguage): CodeBuilder[] => {
  return builders.filter(builder =>
    builder.lang === lang && builder.target
  )
}

// find a build that matches the framework
const filterBuilderByFramework = (framework: string, builders: CodeBuilder[]): CodeBuilder[] => {
  return builders.filter(builder => builder.framework === framework)
}

// report available frameworks for target language
const reportAvailableFrameworks =  (builders: CodeBuilder[]): string[] => {
  return builders.map(builder => builder.framework)
}

class Build extends Command {
  static description = 'describe command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for project containing your typerpc schema files', required: true}),
    output: flags.string({char: 'o', name: 'output', description: 'path to a directory to place generated code', required: true}),
    lang: flags.string({char: 'l', name: 'lang', description: 'the programming language to use for generating code', required: true}),
    framework: flags.string({char: 'f', name: 'framework', description: 'the framework to use for generating code', required: true}),
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

  validateInputs(target: Target, tsConfigFilePath: string, outputPath: string, lang: ProgrammingLanguage, framework: string) {
    let builders: CodeBuilder[]
    return new Listr([{
      title: 'Validating Target',
      task: () => {
        if (isTarget(target)) {
          return true
        }
        this.error(`invalid target: ${target}.
          valid targets are: [client, server]`)
      },
    },
    {
      title: 'Validating tsconfig.json',
      task: async () => validateTsConfigFile(tsConfigFilePath),
    },
    {
      title: 'Validating Output Path',
      task: () => validateOutputPath(outputPath),
    },
    {
      title: 'Validating Schema Files',
      task: () => {
        const project = new Project({tsConfigFilePath, skipFileDependencyResolution: true})
        const errs = validateSchemas(project.getSourceFiles())
        if (errs.length === 0) {
          return true
        }
        this.error(errs.reduce((err, val) => {
          err.name.concat(val.name + '\n')
          err.message.concat(val.message + '\n')
            err.stack?.concat(val.stack + '\n')
            return err
        }))
      },
    },
    {
      title: `locating ${target} builders for language: ${lang}, framework: ${framework} `,
      task: () =>  {
        builders = getBuilders(target, lang)
        if (builders.length === 0) {
          this.error(`no ${target} builders were found for ${lang}`)
        }
        const filtered = filterBuilderByFramework(framework, builders)
        if (filtered.length === 0) {
          this.error(`no ${target} builder found for ${lang} using ${framework}. Available ${target} builders for ${lang} are ${reportAvailableFrameworks(builders)}`)
        }
      },
    },
    {
      title: 'Validation Successful, Generating JobId',
      task: () => true,
    }], {concurrent: true})
  }

  private code: Code[] = []

  buildCode(target: Target, tsConfigFilePath: string, outputPath: string, lang: ProgrammingLanguage, framework: string) {
    const builder = filterBuilderByFramework(framework, getBuilders(target, lang))[0]

    return new Listr([
      {
        title: `Attempting to generate ${lang} ${target} code using ${framework} framework`,
        task: () => {
          const proj = new Project({tsConfigFilePath, skipFileDependencyResolution: true})
          const schemas = buildSchemas(proj.getSourceFiles())
          this.code = builder.build(schemas)
        },
      },
    ])
  }

  async run() {
    const {args, flags} = this.parse(Build)
    const target = args.target.trim()
    const tsConfig = flags.tsConfig?.trim() ?? ''
    const outputPath = flags.output?.trim() ?? ''
    const lang = flags.lang?.trim() ?? ''
    const framework = flags.framework?.trim() ?? ''
    const jobId = nanoid().toLowerCase()

    this.log('Beginning input validation...')
    await this.validateInputs(target, tsConfig, outputPath, lang as ProgrammingLanguage, framework).run()
    this.log()
    await this.buildCode(target, tsConfig, outputPath, lang as ProgrammingLanguage, framework).run()
    if (this.code.length === 0) {
      this.error('no code found to save, exiting')
    } else {
      await this.writeOutput(outputPath, this.code)
    }
    this.log(`JobId: ${jobId} complete, check ${outputPath} for generated ${target} code.`)
  }
}

export = Build
