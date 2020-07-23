import {Command, flags} from '@oclif/command'
import {outputFile, pathExists} from 'fs-extra'
import Listr from 'listr'
import {nanoid} from 'nanoid'
import path from 'path'
import {Code, generateCode, generateTypes, GeneratorError, isTarget} from './gen'
import {Target} from './gen/generator'

type OutputType = 'types' | 'rpc'

class TypeRpc extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for project containing typeRPC schema files'}),
    output: flags.string({char: 'o', name: 'output', description: 'path to a directory to place generated code'}),
    https: flags.boolean({name: 'https', description: 'controls whether the server should use https'}),
    http2: flags.boolean({name: 'http2', description: 'controls whether the server should use http2'}),

  }

  static args = [
    {
      name: 'target',
      required: true,
      description: 'target platform for code generation',
      options: ['client', 'server'],
    },
  ]

  validateInputs(target: Target, tsConfigFile: string, outputPath: string) {
    return new Listr([{
      title: 'Validating Inputs',
      task: () => new Listr([{
        title: 'Validating Target',
        task: () => {
          if (isTarget(target)) {
            return true
          }
          throw new GeneratorError(`error: invalid target ${target}`)
        },
      },
      {
        title: 'Validating tsconfig.json',
        task: async () => this.validateTsConfigFile(tsConfigFile),
      },
      {
        title: 'Validating Output Path',
        task: () => this.validateOutputPath(outputPath),
      },
      {
        title: 'Validation Successful, Generating JobId',
        task: () => true,
      }], {concurrent: true}),
    }])
  }

  generateTypes(target: Target, tsConfigFile: string, outputPath: string, jobId: string) {
    let types: Code
    return new Listr([

      {
        title: `Generating Rpc types for ${target}, jobId: ${jobId}`,
        task: () => {
          types = generateTypes(target, tsConfigFile, outputPath, jobId)
        },
      },
      {
        title: `Saving ${target} types to ${outputPath}`,
        task: async () => this.writeOutput(outputPath, types, 'types'),
      },
    ])
  }

  generateRpc(target: Target, tsConfigFile: string, outputPath: string, jobId: string) {
    let code: Code
    return new Listr([
      {
        title: `Generating Rpc code for ${target}, jobId: ${jobId}`,
        task: () => {
          code = generateCode(target, tsConfigFile, outputPath, jobId)
        },
      },
      {
        title: `Saving ${target} Rpc code to ${outputPath}`,
        task: async () => this.writeOutput(outputPath, code, 'rpc'),
      },
    ])
  }

  async run() {
    const {args, flags} = this.parse(TypeRpc)
    const target = args.target.trim()
    const tsConfig = flags.tsConfig?.trim() ?? ''
    const outputPath = flags.output?.trim() ?? ''
    const jobId = nanoid().toLowerCase()

    await this.validateInputs(target, tsConfig, outputPath).run()
    await this.generateTypes(target, tsConfig, outputPath, jobId).run()
    await this.generateRpc(target, tsConfig, outputPath, jobId).run()

    this.log(`JobId: ${jobId} complete, check ${outputPath} for generated ${target} code.`)
  }

  async tsconfigFileExists(filePath: string): Promise<boolean> {
    return pathExists(filePath)
  }

  async writeOutput(outputPath: string, code: Code, outputType: OutputType): Promise<void> {
    const results = []
    const filePath = (file: string) => outputType === 'types' ? path.join(outputPath, 'types', file) : path.join(outputPath, `${file}`)
    for (const [file, source] of Object.entries(code)) {
      results.push(outputFile(filePath(file), source))
    }

    try {
      this.log(`saving ${outputType} code to ${outputPath}`)
      await Promise.all(results)
      this.log(`${outputType} generation complete, please check ${outputPath} for generated code`)
    } catch (error) {
      this.log(`error occurred writing files: ${error}`)
      throw error
    }
  }

  // ensure that the path to tsconfig.json actually exists
  async validateTsConfigFile(tsConfigFile: string): Promise<void> {
    const exists = await this.tsconfigFileExists(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
      throw new Error('tsconfig.json is invalid or does not exist')
    }
  }

  // ensure the output path is not empty
  validateOutputPath(outputPath: string): void {
    if (outputPath === '') {
      throw new Error('error: no output path provided')
    }
  }
}

export = TypeRpc
