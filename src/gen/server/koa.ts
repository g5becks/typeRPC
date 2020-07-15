import {ServerGenerator} from '../generator'
import {Parser} from '../parser'
/**
 * Generates server side code using https://koajs.com/
 *
 * @export
 * @class KoaGenerator
 * @extends {ServerGenerator}
 */
export class KoaGenerator extends ServerGenerator {
  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser) {
    super(parser)
  }

  generate(): Promise<Map<string, string>> {
    throw new Error('Method not implemented.')
  }
}
