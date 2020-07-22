import { AxiosGenerator } from './client';
import { Code } from './generator';
import { Parser } from './parser';

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

/**
 * Generates client side code from typeRPC schema file
 * @async
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {string} outputPath path to output direcory
 * @param {ClientHttpOption} client choice of which http client to use
 * @returns {Code | GeneratorError} generated code as string or Error
 */
export const generateClient = (tsConfigFilePath: string, outputPath: string): Code | GeneratorError => {
  const parserResult = new Parser(tsConfigFilePath)
  let clientGen: AxiosGenerator
  if (parserResult instanceof Parser) {
    clientGen = new AxiosGenerator(parserResult, outputPath)
  } else {
    return new GeneratorError(parserResult)
  }
  try {
    const code = clientGen.generateRpc()
    return code
  } catch (error) {
    return new GeneratorError(error)
  }
}

/**
 * Generates server side code from typeRPC schema file
 *
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {string} outputPath path to directory to store generated files
 * @param {ServerFrameWorkOption} serverFramework choich of server framework
 * @returns {Code | GeneratorError} generated code as string or Error
 */
export const generateServer = (tsConfigFilePath: string, outputPath: string): Code | GeneratorError => {
  const parserResult = new Parser(tsConfigFilePath)
  if (typeof serverGen === 'string') {
    return new GeneratorError(serverGen)
  }
  try {
    const code = serverGen.generateRpc()
    return code
  } catch (error) {
    return new GeneratorError(error)
  }
}

