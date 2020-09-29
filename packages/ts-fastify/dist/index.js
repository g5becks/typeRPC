"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_utils_1 = require("@typerpc/plugin-utils");
const schema_1 = require("@typerpc/schema");
const ts_plugin_utils_1 = require("@typerpc/ts-plugin-utils");
// build generic route types for fastify route methods
// https://www.fastify.io/docs/latest/TypeScript/#using-generics
const buildReqBodyOrParamsType = (params) => {
    let props = '';
    for (const param of params) {
        props = props.concat(`${plugin_utils_1.lowerCase(param.name)}${param.isOptional ? '?' : ''}: ${ts_plugin_utils_1.dataType(param.type)},
        `);
    }
    return `{${props}
  }`;
};
const requestSchema = (svcName, method) => {
    if (!method.hasParams) {
        return '';
    }
    const schema = ts_plugin_utils_1.buildRequestSchema(svcName, method);
    return schema_1.isQueryMethod(method) ? `querystring: ${schema},` : `body: ${schema},`;
};
const responseSchema = (svcName, method) => {
    if (method.isVoidReturn || method.hasCborReturn) {
        return '';
    }
    return `response: {
        '2xx': ${ts_plugin_utils_1.buildResponseSchema(svcName, method)}
    },`;
};
const errArgs = (method) => {
    if (!method.hasParams) {
        return `""`;
    }
    let p = '';
    for (const param of method.params) {
        p = p.concat(`"${param.name}": "\${${param.name}}",`);
    }
    return `{${p}}`;
};
const invokeMethod = (svcName, method) => {
    const call = `await ${plugin_utils_1.lowerCase(svcName)}.${plugin_utils_1.lowerCase(method.name)}`;
    if (method.isVoidReturn) {
        return !method.hasParams ? call + '()' : call + `(${ts_plugin_utils_1.paramNames(method.params)})`;
    }
    const invoke = `const data = ` + call;
    return method.hasParams ? invoke + `(${ts_plugin_utils_1.paramNames(method.params)})` : invoke + '()';
};
const parseParams = (method) => method.hasParams ? `const {${ts_plugin_utils_1.paramNames(method.params)}} = request.${schema_1.isQueryMethod(method) ? 'query' : 'body'}` : '';
const buildRoute = (svcName, method) => {
    return `instance.route<{
        ${schema_1.isQueryMethod(method) ? 'Querystring' : 'Body'}: ${buildReqBodyOrParamsType(method.params)}
    }>({
      method: '${method.httpMethod.toUpperCase().trim()}',
      url: '/${plugin_utils_1.lowerCase(method.name)}',
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
          \`{"route": "/${plugin_utils_1.lowerCase(svcName)}/${plugin_utils_1.lowerCase(method.name)}", "service_name": "${svcName}", "method_name": "${method.name}", "args": "${errArgs(method)}", "error_msg": "\${error.message}" , "stack": "\${error.stack}"}\`
        );
        reply
          .code(${method.errorCode})
          .send({error: \`\${error.message}\`})
         return
      }

      },
    })
    `;
};
const buildRoutes = (svc) => {
    let routes = '';
    for (const method of svc.methods) {
        routes = routes.concat(buildRoute(svc.name, method));
    }
    return routes;
};
const buildSvcRoutes = (svc) => {
    return `const ${plugin_utils_1.lowerCase(svc.name)} = (${plugin_utils_1.lowerCase(svc.name)}: ${plugin_utils_1.capitalize(svc.name)}): FastifyPluginAsync => async (instance, _) => {
       instance.register(fastifySensible)

       ${buildRoutes(svc)}
    }
    `;
};
const buildPlugin = (svc) => `
export const ${plugin_utils_1.lowerCase(svc.name)}Plugin = (
  ${plugin_utils_1.lowerCase(svc.name)}: ${plugin_utils_1.capitalize(svc.name)},
  logLevel: LogLevel,
  opts: PluginOptions = {}
): RpcPlugin => ({
  plugin: fp(${plugin_utils_1.lowerCase(svc.name)}Routes(${plugin_utils_1.lowerCase(svc.name)}: ${plugin_utils_1.capitalize(svc.name)}), pluginOpts("${svc.name}Plugin", opts)),
  opts: registerOptions("/${plugin_utils_1.lowerCase(svc.name)}", logLevel),
})
`;
const buildPlugins = (schema) => {
    let plugins = '';
    for (const svc of schema.queryServices) {
        plugins = plugins.concat(buildSvcRoutes(svc).concat(buildPlugin(svc)));
    }
    for (const svc of schema.mutationServices) {
        plugins = plugins.concat(buildSvcRoutes(svc).concat(buildPlugin(svc)));
    }
    return plugins;
};
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
    })
    for (const plugin of plugins) {
        instance.register(plugin.plugin, plugin.opts)
    }
    return instance
}
`,
    fileName: 'fastify.rpc.server.ts',
};
const buildFile = (schema) => {
    let types = '';
    for (const msg of schema.messages) {
        types = types.concat(ts_plugin_utils_1.buildType(msg).concat('\n' + ts_plugin_utils_1.buildMsgSchema(msg)));
    }
    const source = `
import fastify, { FastifyPluginAsync, LogLevel } from 'fastify'
import fp, { PluginOptions } from 'fastify-plugin'
import fastifySensible from 'fastify-sensible'
import S from 'fluent-schema'
import { pluginOpts, registerOptions, RpcPlugin } from './fastify.rpc.server'

    ${types}
    ${ts_plugin_utils_1.buildInterfaces(schema)}
    ${buildPlugins(schema)}
    `;
    return { fileName: schema.fileName + '.ts', source };
};
// builds all schemas and server file
const build = (schemas) => [...schemas.map((schema) => buildFile(schema)), server];
exports.default = build;
//# sourceMappingURL=index.js.map