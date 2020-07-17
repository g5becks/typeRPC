import path from 'path'
import {Config, createGenerator} from 'ts-json-schema-generator'
import {GeneratorError} from './gen'
/**
 *  Generates json schema for given type
 *
 * @param {string} filePath path to file where type resides
 * @param {string} type name of the type to generate schema for
 * @returns {string} generated schema
 */
export const jsonSchemaGen = (filePath: string, type: string): string => {
  const config: Config = {path: path.join(__dirname, filePath), type}
  try {
    return JSON.stringify(createGenerator(config).createSchema(config.type), null, 2)
  } catch (error) {
    throw new GeneratorError(error.message)
  }
}
