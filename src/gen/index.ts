import {AxiosGenerator} from './client'
import {Code, Target} from './generator'
import {FastifyGenerator} from './server'

export {Code, Target}

export const isTarget = (target: string): target is Target => {
  return ['client', 'server'].includes(target)
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

export const generateTypes = (target: Target, tsConfigFilePath: string, outputPath: string) => {
  const generator = target === 'client' ? new AxiosGenerator(tsConfigFilePath, outputPath) : new FastifyGenerator(tsConfigFilePath, outputPath)
  return generator.generateTypes()
}

export const generateCode = (target: Target, tsConfigFilePath: string, outputPath: string): Code => {
  const generator = target === 'client' ? new AxiosGenerator(tsConfigFilePath, outputPath) : new FastifyGenerator(tsConfigFilePath, outputPath)
  return generator.generateRpc()
}

