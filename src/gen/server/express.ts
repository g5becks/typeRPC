import {ServerGenerator} from '../generator'

export class ExpressGenerator extends ServerGenerator {
  generate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
