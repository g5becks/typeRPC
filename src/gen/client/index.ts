import {Parser} from '../parser'
import {AxiosGenerator} from './axios'
import {FetchGenerator} from './fetch'
const clients = {
  axios: (parser: Parser, outputPath: string) => new AxiosGenerator(parser, outputPath),
  fetch: (parser: Parser, outputPath: string) => new FetchGenerator(parser, outputPath),
}

export type ClientHttpOption = 'axios' | 'fetch'

/**
 * Gets an instance of a ClientGenerator
 * @async
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {string} outputPath path to the output directory
 * @param {ClientHttpOption} client http client option
 * @returns {(Promise<string | AxiosGenerator | FetchGenerator>)} error description or a client generator
 */
export const getClientGenerator = (tsConfigFilePath: string, outputPath: string, client: ClientHttpOption): string | AxiosGenerator | FetchGenerator => {
  const parserResult = new Parser(tsConfigFilePath)
  if (parserResult instanceof Parser) {
    return clients[client](parserResult, outputPath)
  }
  return parserResult
}
