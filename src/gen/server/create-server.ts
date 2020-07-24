import fastify, {FastifyLoggerInstance, FastifyServerOptions} from 'fastify'
import http2 from 'http2'
import https from 'https'
import pino from 'pino'

export type FastifyHttp2SecureOptions<
  Server extends http2.Http2SecureServer,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    http2: true;
    https: http2.SecureServerOptions;
  }

export type FastifyHttp2Options<
  Server extends http2.Http2Server,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    http2: true;
    http2SessionTimeout?: number;
  }

export type FastifyHttpsOptions<
  Server extends https.Server,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    https: https.ServerOptions;
  }

export function createHttp2SecureServer<Server extends http2.Http2SecureServer>(opts: FastifyHttp2SecureOptions<Server>, logger: pino.Logger) {
  return fastify()
}
