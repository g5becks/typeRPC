import {Command} from '@oclif/command'
import {outputFile, pathExists} from 'fs-extra'
import path from 'path'
import {Code} from '../gen/generator'

export type OutputType = 'types' | 'rpc'
export class TypeRpcCommand extends Command {
  run(): PromiseLike<any> {
    throw new Error('Method not implemented.')
  }

  protected async tsconfigFileExists(filePath: string): Promise<boolean> {
    try {
      const exists = await pathExists(filePath)
      return exists
    } catch (error) {
      this.log(`error occurred: ${error}, failed to check if tsconfig file exists`)
      throw error
    }
  }

  protected async writeOutput(outputPath: string, code: Code, outputType: OutputType): Promise<void>  {
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
  protected async validateTsConfigFile(tsConfigFile: string): Promise<void> {
    const exists = await this.tsconfigFileExists(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
      this.log('error: please provide a path to a valid tsconfig.json file')
      throw new Error('tsconfig.json is invalid or does not exist')
    }
  }

  // ensure the output path is not empty
  protected validateOutputPath(outputPath: string): void {
    if (outputPath === '') {
      this.log('please provide a directory path to write generated output')
      throw new Error('no output path provided')
    }
  }
}
