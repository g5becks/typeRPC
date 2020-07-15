import {ServerGenerator} from '../generator'
/**
 * Generates server side code using https://www.fastify.io/
 *
 * @export
 * @class FastifyGenerator
 * @extends {ServerGenerator}
 */
export class FastifyGenerator extends ServerGenerator {
  async generate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
