
import {ClientHttpOption, getClientGenerator} from './client'
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
 * @param {ClientHttpOption} client choice of which http client to use
 * @returns {(Promise<string | GeneratorError>)} generated code as string or Error
 */
export const generateClient = async (tsConfigFilePath: string, client: ClientHttpOption): Promise<Map<string, string> | GeneratorError> => {
  const clientGen = await getClientGenerator(tsConfigFilePath, client)
  if (typeof clientGen === 'string') {
    return new GeneratorError(clientGen)
  }
  try {
    const code = await clientGen.generate()
    return code
  } catch (error) {
    return new GeneratorError(error)
  }
}

/**
 * Generates server side code from typeRPC schema file
 *
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {ServerFrameWorkOption} serverFramework choich of server framework
 * @returns {(Promise<string | GeneratorError>)} generated code as string or Error
 */
export const generateServer = async (tsConfigFilePath: string, serverFramework: ServerFrameworkOption): Promise<Map<string, string> | GeneratorError> => {
  const serverGen = await getServerGenerator(serverFramework, tsConfigFilePath)
  if (typeof serverGen === 'string') {
    return new GeneratorError(serverGen)
  }
  try {
    const code = await serverGen.generate()
    return code
  } catch (error) {
    return new GeneratorError(error)
  }
}

export {tsConfigExists}

