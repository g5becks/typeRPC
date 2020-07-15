import {Parser} from '../parser'
import {ExpressGenerator} from './express'
import {FastifyGenerator} from './fastify'
import {KoaGenerator} from './koa'

const servers = {express: (parser: Parser): ExpressGenerator => new ExpressGenerator(parser), fastify: (parser: Parser): FastifyGenerator => new FastifyGenerator(parser), koa: (parser: Parser): KoaGenerator => new KoaGenerator(parser)}

export type ServerFrameworkOption = 'express' | 'fastify' | 'koa'

/**
 * Gets an instance of a ServerGenerator
 * @async
 * @function getServerGenerator
 * @param {ServerFrameWorkOption} framework server framework option
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @returns {(Promise<string | ExpressGenerator | FastifyGenerator | KoaGenerator>)} error details as string or server generator class
 */
export const getServerGenerator = async (framework: ServerFrameworkOption, tsConfigFilePath: string): Promise<string | ExpressGenerator | FastifyGenerator | KoaGenerator> => {
  const parserResult = await Parser.create(tsConfigFilePath)
  if (parserResult instanceof Parser) {
    return servers[framework](parserResult)
  }
  return parserResult
}
