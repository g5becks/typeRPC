import {ServerGenerator} from '../generator'
/**
 * Generates server side code using https://koajs.com/
 *
 * @export
 * @class KoaGenerator
 * @extends {ServerGenerator}
 */
export class KoaGenerator extends ServerGenerator {
  generate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
