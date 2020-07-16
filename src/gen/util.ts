import {outputFile, pathExists} from 'fs-extra'
import path = require('path')

export const tsConfigExists = async (filePath: string): Promise<string | boolean> => {
  try {
    const exists = await pathExists(filePath)
    return exists
  } catch (error) {
    return `error occurred: ${error}, failed to check if tsconfig file exists`
  }
}

export const writeOutput = async (outputPath: string, code: Map<string, string>,  target: 'client'| 'server'): Promise<void|string> => {
  const results = []
  for (const entry in code) {
    if (entry.length > 0) {
      const [file, source] = entry
      results.push(outputFile(path.join(outputPath, `${file}.${target}.rpc.ts`), source))
    }
  }
  try {
    await Promise.all(results)
  } catch (error) {
    return `error occurred writing files: ${error}`
  }
}
