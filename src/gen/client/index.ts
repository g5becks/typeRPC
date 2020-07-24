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
    return this.generateTypesDefault()
  }

  generateRpc(): Code {
    return {}
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(protected tsConfigFilePath: string, protected readonly outputPath: string, protected readonly jobId: string) {
    super(tsConfigFilePath, outputPath, jobId)
  }
}
