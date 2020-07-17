import {ClientGenerator, Code} from '../generator'
import {Parser} from '../parser'
/**
 * Generates client side code using https://www.npmjs.com/package/axios
 *
 * @export
 * @class AxiosGenerator
 * @extends {ClientGenerator}
 */
export class AxiosGenerator extends ClientGenerator {
  generateRpc(): Code {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser) {
    super(parser)
  }
}
