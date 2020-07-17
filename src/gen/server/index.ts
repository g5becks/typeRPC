import {Parser} from '../parser'
import {ExpressGenerator} from './express'
import {FastifyGenerator} from './fastify'
import {KoaGenerator} from './koa'

const servers = {express: (parser: Parser, outputPath: string): ExpressGenerator => new ExpressGenerator(parser, outputPath), fastify: (parser: Parser, outputPath: string): FastifyGenerator => new FastifyGenerator(parser, outputPath), koa: (parser: Parser, outputPath: string): KoaGenerator => new KoaGenerator(parser, outputPath)}

export type ServerFrameworkOption = 'express' | 'fastify' | 'koa'

/**
 * Type guard to check for valid server framework string
 *
 * @param {string} framework the framework option
 * @returns {boolean} result of type guard
 */
export const isValidServerFrameworkOption = (framework: string): framework is ServerFrameworkOption => {
  const frameworks = ['express', 'fastify', 'koa']
  return frameworks.includes(framework)
}

/**
 * Gets an instance of a ServerGenerator
 * @async
 * @function getServerGenerator
 * @param {ServerFrameWorkOption} framework server framework option
 * @param {string} tsConfigFilePath path to tsconfig.json
 * @param {string} outputPath path to directory to store generated code
 * @returns {(Promise<string | ExpressGenerator | FastifyGenerator | KoaGenerator>)} error details as string or server generator class
 */
export const getServerGenerator = (framework: ServerFrameworkOption, tsConfigFilePath: string, outputPath: string): string | ExpressGenerator | FastifyGenerator | KoaGenerator => {
  const parserResult = new Parser(tsConfigFilePath)
  if (parserResult instanceof Parser) {
    return servers[framework](parserResult, outputPath)
  }
  return parserResult
}
