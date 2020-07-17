import {ClientGenerator, Code} from '../generator'
import {Parser} from '../parser'
/**
 * Generates client side code using https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *
 * @export
 * @class FetchGenerator
 * @extends {ClientGenerator}
 */
export class FetchGenerator extends ClientGenerator {
  generateRpc(): Code {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(parser: Parser, protected readonly outputPath: string) {
    super(parser, outputPath)
  }
}
