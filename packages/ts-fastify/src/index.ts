/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { Code } from '@typerpc/plugin'
import { capitalize, lowerCase } from '@typerpc/plugin-utils'
import {
    is,
    isMutationMethod,
    isQueryMethod,
    MutationMethod,
    MutationService,
    QueryMethod,
    QueryService,
    Schema,
} from '@typerpc/schema'
import {
    buildInterfaces,
    buildMsgSchema,
    buildParamsVar,
    buildRequestSchema,
    buildResponseSchema,
    buildType,
    buildUnions,
    buildUnionSchemas,
    dataType,
    fromQueryString,
    paramNames,
} from '@typerpc/ts-plugin-utils'

// build generic route types for fastify route methods
// https://www.fastify.io/docs/latest/TypeScript/#using-generics
const buildReqBodyOrParamsType = (method: QueryMethod | MutationMethod): string => {
    if (!method.hasParams) {
        return ''
    }

    let props = ''

    for (const param of method.params) {
        if (isMutationMethod(method)) {
            props = props.concat(`${lowerCase(param.name)}${param.isOptional ? '?' : ''}: ${dataType(param.type)},
        `)
        } else if (isQueryMethod(method)) {
            props = props.concat(
                `${lowerCase(param.name)}${param.isOptional ? '?' : ''}: ${
                    is.scalar(param.type) ? 'string' : 'string[]'
                }`,
            )
        }
    }
    return `{
      ${props}
  }`
}

const requestSchema = (svcName: string, method: QueryMethod | MutationMethod): string => {
    if (!method.hasParams) {
        return ''
    }
    const schema = buildRequestSchema(svcName, method)
    return isQueryMethod(method) ? `querystring: ${schema},` : `body: ${schema},`
}

const responseSchema = (svcName: string, method: QueryMethod | MutationMethod): string => {
    if (method.isVoidReturn || method.hasCborReturn) {
        return ''
    }
    return `response: {
        '2xx': ${buildResponseSchema(svcName, method)}
    },`
}

const errArgs = (method: MutationMethod | QueryMethod): string => {
    if (!method.hasParams) {
        return `""`
    }
    let p = ''
    for (const param of method.params) {
        p = p.concat(`"${param.name}": "\${${param.name}}",`)
    }
    return `{${p}}`
}

const invokeMethod = (svcName: string, method: QueryMethod | MutationMethod): string => {
    const call = `await ${lowerCase(svcName)}.${lowerCase(method.name)}`
    if (method.isVoidReturn) {
        return !method.hasParams ? call + '()' : call + `(${paramNames(method.params)})`
    }
    const invoke = `const data = ` + call
    return method.hasParams ? invoke + `(${paramNames(method.params)})` : invoke + '()'
}

const parseParams = (method: QueryMethod | MutationMethod): string => {
    if (!method.hasParams) {
        return ''
    }
    if (isMutationMethod(method)) {
        return `const {${paramNames(method.params)}} = request.body`
    }
    const variable = buildParamsVar(method.params)
    let parsedParams = ''
    let i = 0
    while (i < method.params.length) {
        const parsed = fromQueryString(`request.query.${method.params[i].name}`, method.params[i].type)
        const useComma = i === method.params.length - 1 ? '' : ', '
        parsedParams = parsedParams.concat(`${method.params[i].name}: ${parsed}${useComma}`)
        i++
    }
    return `${variable} = {${parsedParams}}`
}
const buildRoute = (svcName: string, method: QueryMethod | MutationMethod): string => {
    const genericRequestType = `<{
        ${isQueryMethod(method) ? 'Querystring' : 'Body'}: ${buildReqBodyOrParamsType(method)}
    }>`

    return `instance.route${method.hasParams ? genericRequestType : ''}({
      method: '${method.httpMethod.toUpperCase().trim()}',
      url: '/${lowerCase(method.name)}',
      schema: {
         ${requestSchema(svcName, method)}
         ${responseSchema(svcName, method)}
      },
      handler: async (request, reply) => {
        ${parseParams(method)}
      try {
        ${invokeMethod(svcName, method)}
        reply
        .code(${method.responseCode})
        .type('application/${method.hasCborReturn ? 'cbor' : 'json'}')
        .send({data})

      } catch (error) {
        request.log.error(
          \`{"route": "/${lowerCase(svcName)}/${lowerCase(
        method.name,
    )}", "service_name": "${svcName}", "method_name": "${method.name}", "args": "${errArgs(
        method,
    )}", "error_msg": "\${error.message}" , "stack": "\${error.stack}"}\`
        );
        reply
          .code(${method.errorCode})
          .send({error: \`\${error.message}\`, user_msg: 'internal server error'})
         return
      }

      },
    })
    `
}

const buildRoutes = (svc: MutationService | QueryService): string => {
    let routes = ''
    for (const method of svc.methods) {
        routes = routes.concat(buildRoute(svc.name, method))
    }
    return routes
}

const buildSvcRoutes = (svc: MutationService | QueryService): string => {
    return `const ${lowerCase(svc.name)}Routes = (${lowerCase(svc.name)}: ${capitalize(
        svc.name,
    )}): FastifyPluginAsync => async (instance) => {
       instance.register(fastifySensible)

       ${buildRoutes(svc)}
    }
    `
}

const buildPlugin = (svc: MutationService | QueryService): string => `
export const ${lowerCase(svc.name)}Plugin = (
  ${lowerCase(svc.name)}: ${capitalize(svc.name)},
  logLevel: LogLevel,
  opts: PluginOptions = {}
): RpcPlugin => ({
  plugin: fp(${lowerCase(svc.name)}Routes(${lowerCase(svc.name)}), pluginOpts("${svc.name}Plugin", opts)),
  opts: registerOptions("/${lowerCase(svc.name)}", logLevel),
})
`

const buildPlugins = (schema: Schema): string => {
    let plugins = ''
    for (const svc of schema.queryServices) {
        plugins = plugins.concat(buildSvcRoutes(svc).concat(buildPlugin(svc)))
    }
    for (const svc of schema.mutationServices) {
        plugins = plugins.concat(buildSvcRoutes(svc).concat(buildPlugin(svc)))
    }
    return plugins
}

const server = {
    source: `
import fastify, {
    FastifyInstance,
    FastifyLoggerInstance,
    FastifyPluginCallback,
    FastifyServerOptions,
    LogLevel,
} from 'fastify'
import { PluginOptions } from 'fastify-plugin'
import { RegisterOptions } from 'fastify/types/register'
import http2 from 'http2'
import https from 'https'
import pino from 'pino'
import qs from 'qs'

/**
 * Creates an implementation of PluginOptions for a fastify-plugin
 * @see {@link https://github.com/fastify/fastify-plugin#metadata}
 *
 * @function pluginOpts
 * @param {string} name @see {@link https://github.com/fastify/fastify-plugin#name}
 * @param {PluginOptions} opts additional options for the generated plugin
 * @returns {PluginOptions} PluginOptions
 */
export const pluginOpts = (
  name: string,
  opts?: PluginOptions
): PluginOptions => {
  return {
    ...opts,
    fastify: "3.x",
    name,
  }
}

/**
 * Used as a container for the plugin and the options to pass to
 * fastify.register() function @see {@link https://www.fastify.io/docs/latest/TypeScript/#register}
 *
 * @type {object}
 * @property {FastifyPluginCallback} plugin the plugin to register
 * @property {RegisterOptions} opts options to pass to register function
 */
export type RpcPlugin = {
  plugin: FastifyPluginCallback;
  opts: RegisterOptions;
}

/**
 * A helper function used for creating {@link RegisterOptions}
 *
 * @function registerOptions
 * @param {string} prefix prefix for the routes @see {@link https://www.fastify.io/docs/latest/Plugins/#plugin-options}
 * @param {LogLevel} logLevel logLevel for the plugin
 * @returns {RegisterOptions} returns the RegisterOptions
 */
export const registerOptions = (
  prefix: string,
  logLevel: LogLevel
): RegisterOptions => {
  return { prefix, logLevel }
}

/**
 * Used as opts param to {@link createHttp2SecureServer} function
 *
 * @type {object}
 */
export type FastifyHttp2SecureOptions<
    Server extends http2.Http2SecureServer,
    Logger extends FastifyLoggerInstance = FastifyLoggerInstance
> = FastifyServerOptions<Server, Logger> & {
    http2: true
    https: http2.SecureServerOptions
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
    http2: true
    http2SessionTimeout?: number
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
    https: https.ServerOptions
}

/**
 * Creates a {@link FastifyInstance} with http2 and https enabled
 *
 * @export
 * @template Server the type of server to create
 * @param {FastifyHttp2SecureOptions<Server>} opts @see {@link https://www.fastify.io/docs/latest/Server/}
 * @param {pino.Logger} logger a pino.Logger instance @see {@link https://github.com/pinojs/pino/blob/HEAD/docs/api.md}
 * @param {...RpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createHttp2SecureServer<Server extends http2.Http2SecureServer>(
    opts: FastifyHttp2SecureOptions<Server>,
    logger: pino.Logger,
    ...plugins: RpcPlugin[]
): FastifyInstance<Server> {
    const instance = fastify({
        ...opts,
        logger,
        querystringParser: (str) => (qs.parse(str) as unknown) as { [key: string]: string | string[] },
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
 * @param {...RpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createHttp2Server<Server extends http2.Http2Server>(
    opts: FastifyHttp2Options<Server>,
    logger: pino.Logger,
    ...plugins: RpcPlugin[]
): FastifyInstance<Server> {
    const instance = fastify({
        ...opts,
        logger,
        querystringParser: (str) => (qs.parse(str) as unknown) as { [key: string]: string | string[] },
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
 * @param {...RpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createSecureServer<Server extends https.Server>(
    opts: FastifyHttpsOptions<Server>,
    logger: pino.Logger,
    ...plugins: RpcPlugin[]
): FastifyInstance<Server> {
    const instance = fastify({
        ...opts,
        logger,
        querystringParser: (str) => (qs.parse(str) as unknown) as { [key: string]: string | string[] },
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
 * @param {...RpcPlugin[]} plugins list of plugins to register
 * @returns {FastifyInstance<Server>} configured {@link FastifyInstance}
 */
export function createServer(
    opts: FastifyServerOptions,
    logger: pino.Logger,
    ...plugins: RpcPlugin[]
): FastifyInstance {
    const instance = fastify({
        ...opts,
        logger,
        querystringParser: (str) => (qs.parse(str) as unknown) as { [key: string]: string | string[] },
    })
    for (const plugin of plugins) {
        instance.register(plugin.plugin, plugin.opts)
    }
    return instance
}
`,
    fileName: 'fastify.rpc.server.ts',
}

const buildFile = (schema: Schema): Code => {
    let types = ''
    for (const msg of schema.messages) {
        types = types.concat(buildType(msg).concat('\n' + buildMsgSchema(msg, schema.fileName)))
    }
    const source = `
import fastify, { FastifyPluginAsync, LogLevel } from 'fastify'
import fp, { PluginOptions } from 'fastify-plugin'
import fastifySensible from 'fastify-sensible'
import S from 'fluent-schema'
import { pluginOpts, registerOptions, RpcPlugin } from './fastify.rpc.server'

    ${types}
    ${buildUnions(schema)}
    ${buildUnionSchemas(schema.unions)}
    ${buildInterfaces(schema)}
    ${buildPlugins(schema)}
    `
    return { fileName: schema.fileName + '.ts', source }
}

// builds all schemas and server file
const build = (schemas: Schema[]): Code[] => [...schemas.map((schema) => buildFile(schema)), server]

export default build
