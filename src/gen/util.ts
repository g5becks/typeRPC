import {outputFile, pathExists} from 'fs-extra'
import {GeneratorError} from '.'
import {Code} from './generator'
import path = require('path')

export const tsConfigExists = async (filePath: string): Promise<string | boolean> => {
  try {
    const exists = await pathExists(filePath)
    return exists
  } catch (error) {
    return `error occurred: ${error}, failed to check if tsconfig file exists`
  }
}

export const writeTypesOutput = async (outputPath: string, code: Code): Promise<string | GeneratorError> => {
  const results = []
  for (const [file, source] of  Object.entries(code)) {
    results.push(outputFile(path.join(outputPath, `${file}`), source))
  }

  try {
    await Promise.all(results)
    return `server code generation complete, please check ${outputPath} for your files`
  } catch (error) {
    return new GeneratorError(`error occurred writing files: ${error}`)
  }
}
