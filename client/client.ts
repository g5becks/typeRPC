/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import fastJson from 'fast-json-stringify'
import {Book, BookService} from './types/book-service'
import {isValidHttpUrl, RpcClientConfig, RpcError} from './types/sculuhwvlbhjf5r13sy2f'
export class AxiosBookService implements BookService {
  protected readonly axios: AxiosInstance

  private constructor(protected readonly host: string, protected readonly config?: RpcClientConfig) {
    this.axios = axios.create({baseURL: host, ...config})
  }

  public static create(host: string, config?: AxiosRequestConfig): AxiosBookService| RpcError {
    if (!isValidHttpUrl(host)) {
      return new RpcError(`${host} is not a valid http url`)
    }
    return new AxiosBookService(host, config)
  }

  protected stringify(): string {
    const stringify = fastJson({
      title: 'Example Schema',
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        age: {
          description: 'Age in years',
          type: 'integer',
        },
        reg: {
          type: 'string',
        },
      },
    })
    return stringify({})
  }

  async getBooksByPublisher(publisher: string, publisherName: string): Promise<Book[]> {
    const config: AxiosRequestConfig = {}
    const data = await this.axios.request<string>({url: '/', method: 'GET', responseType: 'json'})
  }

  getBooksReleasedBefore(releaseDate: Date): Promise<Date[]> {
    throw new Error('Method not implemented.')
  }

  handleErr<T>(err: Error): T {
    throw new Error('Method not implemented.')
  }
}
