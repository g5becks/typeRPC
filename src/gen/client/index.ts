import {Parser} from '../parser'
import {AxiosGenerator} from './axios'
import {FetchGenerator} from './fetch'
const clients = {
  axios: (parser: Parser) => new AxiosGenerator(parser),
  fetch: (parser: Parser) => new FetchGenerator(parser),
}

export type ClientHttpOption = 'axios' | 'fetch'

/**
 * Gets an instance of a ClientGenerator
 * @async
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {ClientHttpOption} client http client option
 * @returns {(Promise<string | AxiosGenerator | FetchGenerator>)} error description or a client generator
 */
export const getClientGenerator = async (tsConfigFilePath: string, client: ClientHttpOption): Promise<string | AxiosGenerator | FetchGenerator> => {
  const parserResult = new Parser(tsConfigFilePath)
  if (parserResult instanceof Parser) {
    return clients[client](parserResult)
  }
  return parserResult
}
