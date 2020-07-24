import {ClientGenerator, Code, Target} from '../generator'
/**
 * Generates client side code using https://www.npmjs.com/package/axios
 *
 * @export
 * @class AxiosGenerator
 * @extends {ClientGenerator}
 */
export class AxiosGenerator extends ClientGenerator {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly target: Target, protected tsConfigFilePath: string, protected readonly outputPath: string, protected readonly jobId: string) {
    super(target, tsConfigFilePath, outputPath, jobId)
  }

  private typesCode(): string {
    return `
export const isValidHttpUrl = (urlString: string): boolean => {
  let url: URL

  try {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    url = new URL(urlString)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
`
  }

  public generateTypes(): Code {
    const file = `${this.jobId}.ts`
    return this.generateTypesDefault({
      [file]: this.typesCode(),
    })
  }

  generateRpc(): Code {
    return {}
  }
}
