import {ServerGenerator} from '../generator'

/**
 * Generates server side code using https://expressjs.com/
 *
 * @export
 * @class ExpressGenerator
 * @extends {ServerGenerator}
 */
export class ExpressGenerator extends ServerGenerator {
  generate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
