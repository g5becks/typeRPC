import {ClientGenerator} from '../generator'
import {Parser} from '../parser'
/**
 * Generates client side code using https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *
 * @export
 * @class FetchGenerator
 * @extends {ClientGenerator}
 */
export class FetchGenerator extends ClientGenerator {
  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser) {
    super(parser)
  }

  generate(): Promise<Map<string, string>> {
    throw new Error('Method not implemented.')
  }
}
