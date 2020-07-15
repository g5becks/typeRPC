
import {ClientHttpOption, getClientGenerator} from './client'
import {getServerGenerator, ServerFrameworkOption} from './server'

/**
 * An error that occurs creating a Generator
 *
 * @export
 * @class GeneratorError
 */
export class GeneratorError {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly errorMessage: string) {}
}
/**
 * Generates client side code from typeRPC schema file
 * @async
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {ClientHttpOption} client choice of which http client to use
 * @returns {(Promise<string | GeneratorError>)} generated code as string or Error
 */
export const generateClient = async (tsConfigFilePath: string, client: ClientHttpOption): Promise<string | GeneratorError> => {
  const clientGen = await getClientGenerator(tsConfigFilePath, client)
  if (typeof clientGen === 'string') {
    return new GeneratorError(clientGen)
  }
  return clientGen.generate()
}

/**
 * Generates server side code from typeRPC schema file
 *
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {ServerFrameWorkOption} serverFramework choich of server framework
 * @returns {(Promise<string | GeneratorError>)} generated code as string or Error
 */
export const generateServer = async (tsConfigFilePath: string, serverFramework: ServerFrameworkOption): Promise<string | GeneratorError> => {
  const serverGen = await getServerGenerator(serverFramework, tsConfigFilePath)
  if (typeof serverGen === 'string') {
    return new GeneratorError(serverGen)
  }
  return serverGen.generate()
}
