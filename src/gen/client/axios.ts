import {ClientGenerator} from '../generator'
/**
 * Generates client side code using https://www.npmjs.com/package/axios
 *
 * @export
 * @class AxiosGenerator
 * @extends {ClientGenerator}
 */
export class AxiosGenerator extends ClientGenerator {
  generate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
