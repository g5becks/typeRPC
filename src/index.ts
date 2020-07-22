import {Command, flags} from '@oclif/command'
import {outputFile, pathExists} from 'fs-extra'
import path from 'path'
import {Code} from './gen'

type OutputType = 'types' | 'rpc'

class TypeRpc extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for project containing typeRPC schema files'}),
    output: flags.string({char: 'o', name: 'output', description: 'path to a directory to place generated code'}),

    /*     framework: flags.string({char: 'f', name: 'framework', description: 'which framework to use for generating the server code. Option are express | koa | fastify'}),
 */
    https: flags.boolean({name: 'https', description: 'controls whether the server should use https'}),
    http2: flags.boolean({name: 'http2', description: 'controls whether the server should use http2'}),

  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(TypeRpc)

    const tsConfig = flags.tsConfig ?? ''
    const outputPath = flags.output ?? ''
    await this.validateTsConfigFile(tsConfig)
    this.validateOutputPath(outputPath)
    const serverGen = new FastifyGenerator(tsConfig, outputPath)
    const types: Code = serverGen.generateTypes()
    if (types) {
      await this.writeOutput(outputPath, types, 'types')
    }

    const code = generateServer(tsConfig, outputPath)
    if (code instanceof GeneratorError) {
      this.log(code.errorMessage)
      throw code
    }
    this.log(`generating server code using ${serverFramework}`)
    await this.writeOutput(outputPath, code, 'types')
  }

  async tsconfigFileExists(filePath: string): Promise<boolean> {
    try {
      const exists = await pathExists(filePath)
      return exists
    } catch (error) {
      this.log(`error occurred: ${error}, failed to check if tsconfig file exists`)
      throw error
    }
  }

  async writeOutput(outputPath: string, code: Code, outputType: OutputType): Promise<void> {
    const results = []
    for (const [file, source] of Object.entries(code)) {
      results.push(outputFile(path.join(outputPath, `${file}`), source))
    }

    try {
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
      this.log('error: please provide a path to a valid tsconfig.json file')
      throw new Error('tsconfig.json is invalid or does not exist')
    }
  }

  // ensure the output path is not empty
  validateOutputPath(outputPath: string): void {
    if (outputPath === '') {
      this.log('please provide a directory path to write generated output')
      throw new Error('no output path provided')
    }
  }
}

export = TypeRpc
