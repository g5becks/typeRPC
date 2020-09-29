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
    isQueryMethod,
    MutationMethod,
    MutationService,
    Param,
    QueryMethod,
    QueryService,
    Schema,
} from '@typerpc/schema'
import {
    buildInterfaces,
    buildMsgSchema,
    buildRequestSchema,
    buildType,
    dataType,
    paramNames,
} from '@typerpc/ts-plugin-utils'

// build generic route types for fastify route methods
// https://www.fastify.io/docs/latest/TypeScript/#using-generics
const buildReqBodyOrParamsType = (params: ReadonlyArray<Param>): string => {
    let props = ''

    for (const param of params) {
        props = props.concat(`${lowerCase(param.name)}${param.isOptional ? '?' : ''}: ${dataType(param.type)},
        `)
    }
    return `{${props}
  }`
}

const requestSchema = (svcName: string, method: QueryMethod | MutationMethod): string => {
    if (!method.hasParams) {
        return ''
    }
    return isQueryMethod(method) ? 'querystring' : 'body' + `: ${buildRequestSchema(svcName, method)}`
}
const buildRoute = (svcName: string, method: QueryMethod | MutationMethod): string => {
    return `instance.route<{
        ${isQueryMethod(method) ? 'Querystring' : 'Body'}: ${buildReqBodyOrParamsType(method.params)}
    }>({
      method: '${method.httpMethod.toUpperCase().trim()}',
      url: '/${lowerCase(method.name)}',
      schema: {
         ${requestSchema(svcName, method)}
      },
      handler: async (request, reply) => {
        const {${paramNames(method.params)}} = request.${isQueryMethod(method) ? 'query' : 'body'}
      },
    })`
}

const buildRoutes = (svc: MutationService | QueryService): string => {
    return `${lowerCase(svc.name)} = (${lowerCase(svc.name)}: ${capitalize(
        svc.name,
    )}): FastifyPluginAsync => async (instance, _) => {
       instance.register(fastifySensible)
    }`
}
const helpers = `
import { FastifyPluginCallback, LogLevel } from "fastify"
import { PluginOptions } from "fastify-plugin"
import { RegisterOptions } from "fastify/types/register"

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
}`

const buildFile = (schema: Schema): Code => {
    let types = ''
    for (const msg of schema.messages) {
        types = types.concat(buildType(msg).concat('\n' + buildMsgSchema(msg)))
    }
    const source = `
    ${types}
    ${buildInterfaces(schema)}`
    return { fileName: schema.fileName + '.ts', source }
}
// builds all schemas and server file
const build = (schemas: Schema[]): Code[] => [...schemas.map((schema) => buildFile(schema)), buildServer(schemas)]

export default build
