import {ClientGenerator} from '../generator'
/**
 * Generates client side code using https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *
 * @export
 * @class FetchGenerator
 * @extends {ClientGenerator}
 */
export class FetchGenerator extends ClientGenerator {
  generate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
