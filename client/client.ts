/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosRequestConfig } from 'axios'
import { Book, BookService } from './types/book-service'
export class BookServiceClient implements BookService {

  protected readonly serviceHost: string
  private constructor(host: string, protected readonly config?: AxiosRequestConfig) {
    this.serviceHost = new URL(host).toString()
  }
  getBooksByPublisher(publisher: string, publisherName: string, ...headers:  ): Promise<Book[]> {
    const config:AxiosRequestConfig = {}
    axios({})
  }

  getBooksReleasedBefore(releaseDate: Date): Promise<Date[]> {
    throw new Error('Method not implemented.')
  }

  handleErr<T>(err: Error): T {
    throw new Error('Method not implemented.')
  }
}
