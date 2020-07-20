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
}
