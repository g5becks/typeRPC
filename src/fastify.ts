/* eslint-disable new-cap */
import {FastifyPluginAsync, LogLevel} from 'fastify'
import fp, {PluginOptions} from 'fastify-plugin'
import {pluginOpts, registerOptions, TypeRpcPlugin} from './rpc.server.util'

type Book = {
  publisher: string;
  releaseDate: Date;
}

type Other = string | number | boolean
const BookSchema = {type: 'object', properties: {publisher: {type: 'string'}, releaseDate: {description: 'Enables basic storage and retrieval of dates and times.', type: 'string', format: 'date-time'}}, $schema: 'http://json-schema.org/draft-07/schema#'}

const OtherSchema = {type: ['string', 'number', 'boolean'], $schema: 'http://json-schema.org/draft-07/schema#'}

interface BookService {
  getBooksByPublisher(publisher: string, publisherName: string): Book[];
  getBooksReleasedBefore(releaseDate: Date): Date[];
}

interface BookService2 {
  printService(): void;
}

const BookService = (bookService: BookService): FastifyPluginAsync => async (instance, _) => {
  instance.route<{Body: Book}>(
    {method: 'POST',
      url: '',
      schema: {
        body: BookSchema,
        response: {
          200: OtherSchema,
        },

      },
      handler: async (request, reply) => {
        const {publisher, releaseDate} = request.body

        reply.send({publisher, releaseDate})
      },
    }
  )
}
export const BookServicePlugin = (bookService: BookService, logLevel: LogLevel, opts?: PluginOptions): TypeRpcPlugin => {
  return {plugin: fp(BookService(bookService), pluginOpts('', opts)), opts: registerOptions('', logLevel)}
}

