import {Command} from '@oclif/command'
import {outputFile, pathExists} from 'fs-extra'
import path from 'path'
import {GeneratorError} from '../gen'
import {Code} from '../gen/generator'

export type OutputType = 'types' | 'rpc'
export class TypeRpcCommand extends Command {
  run(): PromiseLike<any> {
    throw new Error('Method not implemented.')
  }

  protected async tsconfigFileExists(filePath: string): Promise<string | boolean> {
    try {
      const exists = await pathExists(filePath)
      return exists
    } catch (error) {
      return `error occurred: ${error}, failed to check if tsconfig file exists`
    }
  }

  protected async writeOutput(outputPath: string, code: Code, outputType: OutputType): Promise<string | GeneratorError>  {
    const results = []
    for (const [file, source] of Object.entries(code)) {
      results.push(outputFile(path.join(outputPath, `${file}`), source))
    }

    try {
      await Promise.all(results)
      return `${outputType} generation complete, please check ${outputPath} for generated code`
    } catch (error) {
      return new GeneratorError(`error occurred writing files: ${error}`)
    }
  }
}
