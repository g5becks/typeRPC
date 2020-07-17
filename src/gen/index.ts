
import {ClientHttpOption, getClientGenerator} from './client'
import {Code} from './generator'
import {getServerGenerator, ServerFrameworkOption} from './server'
import {tsConfigExists} from './util'

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
 * @returns {(Promise<string | GeneratorError>)} generated code as string or Error
 */
export const generateClient = (tsConfigFilePath: string, outputPath: string,  client: ClientHttpOption): Code | GeneratorError => {
  const clientGen = getClientGenerator(tsConfigFilePath, outputPath, client)
  if (typeof clientGen === 'string') {
    return new GeneratorError(clientGen)
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
 * @returns {(Promise<string | GeneratorError>)} generated code as string or Error
 */
export const generateServer = async (tsConfigFilePath: string, outputPath: string, serverFramework: ServerFrameworkOption): Promise<Code | GeneratorError> => {
  const serverGen = getServerGenerator(serverFramework, tsConfigFilePath, outputPath)
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

export {tsConfigExists}

