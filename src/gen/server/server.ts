export const server = {'create-server.ts':
`
import fastify, {FastifyInstance, FastifyLoggerInstance, FastifyPluginCallback, FastifyServerOptions, RegisterOptions} from 'fastify'
import http2 from 'http2'
import https from 'https'
import pino from 'pino'

/**
* Used as opts param to {@link createHttp2SecureServer} function
*
* @type {object}
 */
export type FastifyHttp2SecureOptions<
  Server extends http2.Http2SecureServer,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    http2: true;
    https: http2.SecureServerOptions;
  }

/**
 * Used as opts param to {@link createHttp2Server} function
 *
 * @type {object}
 */
export type FastifyHttp2Options<
  Server extends http2.Http2Server,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    http2: true;
    http2SessionTimeout?: number;
  }

/**
* Used as opts param to {@link createSecureServer} function
*
* @type {object}
*/
export type FastifyHttpsOptions<
  Server extends https.Server,
  Logger extends FastifyLoggerInstance = FastifyLoggerInstance
  > = FastifyServerOptions<Server, Logger> & {
    https: https.ServerOptions;
  }

/**
 * Used as a container for the plugin and the options to pass to
 * fastify.register() function @see {@link https://www.fastify.io/docs/latest/TypeScript/#register}
 *
 * @type {object}
 * @property {FastifyPluginCallback} plugin the plugin to register
 * @property {RegisterOptions} opts options to pass to register function
 */
export type TypeRpcPlugin = {
  plugin: FastifyPluginCallback;
  opts: RegisterOptions;
}

/**
 * Creates a {@link FastifyInstance} with http2 and https enabled
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createHttp2SecureServer<Server extends http2.Http2SecureServer>(opts: FastifyHttp2SecureOptions<Server>, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance<Server> {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}

/**
 * Creates a {@link FastifyInstance} with https enables
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createHttp2Server<Server extends http2.Http2Server>(opts: FastifyHttp2Options<Server>, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance<Server> {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}

/**
 * Creates a {@link FastifyInstance} with https enabled
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createSecureServer<Server extends https.Server>(opts: FastifyHttpsOptions<Server>, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance<Server> {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}

/**
 * Creates a {@link FastifyInstance}
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...TypeRpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createServer(opts: FastifyServerOptions, logger: pino.Logger, ...plugins: TypeRpcPlugin[]): FastifyInstance {
  const instance = fastify({
    ...opts,
    ...logger,
  })
  for (const plugin of plugins) {
    instance.register(plugin.plugin, plugin.opts)
  }
  return instance
}
`}
