/* eslint-disable @typescript-eslint/no-unused-vars */
import to from 'await-to-js'
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import {Book, BookService} from './types/book-service'
export class AxiosBookService implements BookService {
  protected readonly axios: AxiosInstance

  private constructor(protected readonly host: string, protected readonly config?: AxiosRequestConfig) {
    this.axios = axios.create(config)
  }

  async getBooksByPublisher(publisher: string, publisherName: string): Promise<Book[]> {
    const config: AxiosRequestConfig = {}
    const [err] = await to(this.axios.request<string>({responseType: 'json'}))
  }

  getBooksReleasedBefore(releaseDate: Date): Promise<Date[]> {
    throw new Error('Method not implemented.')
  }

  handleErr<T>(err: Error): T {
    throw new Error('Method not implemented.')
  }
}
