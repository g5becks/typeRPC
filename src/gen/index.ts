import {AxiosGenerator} from './client'
import {Code, Target} from './generator'
import {FastifyGenerator} from './server'

export {Code, Target}
export type GeneratorResult = {
  types: Code;
  rpc: Code;
}
/**
 * An error that occurs either creating a creating Generator or from the result of a Generator attempting to generate code
 *
 * @export
 * @class GeneratorError
 */
export class GeneratorError extends Error {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly errorMessage: string) {
    super(errorMessage)
  }
}

export const generateCode = (target: Target, tsConfigFilePath: string, outputPath: string): GeneratorResult => {
  const generator = target === 'client' ? new AxiosGenerator(tsConfigFilePath, outputPath) : new FastifyGenerator(tsConfigFilePath, outputPath)
  const types = generator.generateTypes()
  const rpc = generator.generateRpc()
  return {types, rpc}
}

