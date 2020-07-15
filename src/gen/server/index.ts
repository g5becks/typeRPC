import {Parser} from '../parser'
import {ExpressGenerator} from './express'
import {FastifyGenerator} from './fastify'
import {KoaGenerator} from './koa'

const servers = {express: (parser: Parser) => new ExpressGenerator(parser), fastify: (parser: Parser) => new FastifyGenerator(parser), koa: (parser: Parser) => new KoaGenerator(parser)}
type ServerFrameWorkOption = 'express' | 'fastify' | 'koa'
export const getServerGenerator = async (framework: ServerFrameWorkOption, tsConfigFilePath: string) => {
  const parserResult = await Parser.create(tsConfigFilePath)
  if (parserResult instanceof Parser) {
    return servers[framework](parserResult)
  }
  return parserResult
}
