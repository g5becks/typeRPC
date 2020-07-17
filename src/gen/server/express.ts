import {Code, ServerGenerator} from '../generator'
import {Parser} from '../parser'

/**
 * Generates server side code using https://expressjs.com/
 *
 * @export
 * @class ExpressGenerator
 * @extends {ServerGenerator}
 */
export class ExpressGenerator extends ServerGenerator {
  generateRpc(): Code {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser, protected readonly outputPath: string) {
    super(parser, outputPath)
  }
}
