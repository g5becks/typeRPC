import {SourceFile} from 'ts-morph'
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
import {AxiosAdapter, AxiosBasicCredentials, AxiosProxyConfig, AxiosTransformer, CancelToken} from 'axios'

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

export class RpcError extends Error {
  constructor(public readonly message: string) {
    super(message)
  }
}

export type RpcClientConfig = {
  transformRequest?: AxiosTransformer | AxiosTransformer[];
  transformResponse?: AxiosTransformer | AxiosTransformer[];
  headers?: any;
  paramsSerializer?: (params: any) => string;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig | false;
  cancelToken?: CancelToken;
}
`
  }

  protected imports(file: SourceFile): string {
    return `
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import fastJson from 'fast-json-stringify'
import { Book, BookService } from './types/book-service'
import { isValidHttpUrl, RpcClientConfig, RpcError } from './types/${this.jobId}'
${this.getImportedTypes(file)}
    `
  }

  public generateTypes(): Code {
    const file = `${this.jobId}.ts`
    return this.generateTypesDefault({
      [file]: this.typesCode(),
    })
  }

  generateRpc(): Code {
    const code: Code = {}
    for (const file of this.parser.sourceFiles) {
      const schemas = this.buildShemasForFile(file)
      code[this.buildRpcFileName(file)] = `${this.imports(file)}${this.fileHeader()}${schemas}$`
    }
    return code
  }
}

