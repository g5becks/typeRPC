import {ClientGenerator, Code} from '../generator'
/**
 * Generates client side code using https://www.npmjs.com/package/axios
 *
 * @export
 * @class AxiosGenerator
 * @extends {ClientGenerator}
 */
export class AxiosGenerator extends ClientGenerator {
  public generateTypes(): Code {
    throw new Error('Method not implemented.')
  }

  generateRpc(): Code {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(protected tsConfigFilePath: string, protected readonly outputPath: string) {
    super(tsConfigFilePath, outputPath)
  }
}
