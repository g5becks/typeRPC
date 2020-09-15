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
exports.testing = void 0;
const schema_1 = require("@typerpc/schema");
const plugin_utils_1 = require("@typerpc/plugin-utils");
const ts_plugin_utils_1 = require("@typerpc/ts-plugin-utils");
const logger = `
interface ErrLogger {
  error(message: string, ...meta: any[]): void;
}

const defaultLogger: ErrLogger = {
  error(message: string, ...meta) {
    console.log(\`error occurred :\${message}, info: \${meta}\`)
  }
}
`;
// builds a destructured object location query params by converting them to the
// correct types using the fromQueryString function
const buildDestructuredParams = (params) => {
    if (params.length === 0) {
        return '';
    }
    const variable = ts_plugin_utils_1.buildParamsVar(params);
    let parsedParams = '';
    let i = 0;
    while (i < params.length) {
        const parsed = ts_plugin_utils_1.fromQueryString(`ctx.query.${params[i].name}`, params[i].type);
        const useComma = i === params.length - 1 ? '' : ', ';
        parsedParams = parsedParams.concat(`${params[i].name}: ${parsed}${useComma}`);
        i++;
    }
    return `${variable} = {${parsedParams}}`;
};
const buildMethodCall = (svcName, method) => {
    const paramsFromBody = schema_1.isQueryMethod(method)
        ? buildDestructuredParams(method.params)
        : `${ts_plugin_utils_1.buildParamsVar(method.params)} = ctx.request.body`;
    const invokeMethod = method.isVoidReturn
        ? `await ${plugin_utils_1.lowerCase(svcName)}.${method.name}(${ts_plugin_utils_1.paramNames(method.params)})`
        : `const res: ${ts_plugin_utils_1.dataType(method.returnType)} = await ${plugin_utils_1.lowerCase(svcName)}.${method.name}(${ts_plugin_utils_1.paramNames(method.params)})`;
    const sendResponse = method.isVoidReturn
        ? ''
        : `ctx.body = ${method.hasCborReturn ? '{data: await encodeAsync(res)}' : '{data: res}'}`;
    return `${paramsFromBody}\n${invokeMethod}\n${sendResponse}`;
};
const buildRouteHandler = (svcName, method) => {
    return `
router.${method.httpMethod.toLowerCase()}('${svcName}/${method.name}', '/${method.name}', async ctx => {
    try {
      ${buildMethodCall(svcName, method)}
      ctx.type = ${plugin_utils_1.serverResponseContentType(method)}
      ctx.status = ${method.responseCode}
    } catch (error) {
      logger.error(error)
      ctx.throw(${method.errorCode}, error.message)
    }
})\n`;
};
const buildRouteHandlers = (svc) => {
    let handlers = '';
    for (const method of svc.methods) {
        handlers = handlers.concat(buildRouteHandler(svc.name, method));
    }
    return handlers;
};
const buildService = (svc) => {
    return `
export const ${plugin_utils_1.capitalize(svc.name)} = (${plugin_utils_1.lowerCase(svc.name)}: ${plugin_utils_1.capitalize(svc.name)}, logger: ErrLogger = defaultLogger): Middleware<Koa.ParameterizedContext<any, Router.RouterParamContext>> => {
	const router = new Router({
		prefix: '/${plugin_utils_1.lowerCase(svc.name)}/',
		sensitive: true
	})
  ${buildRouteHandlers(svc)}
	return router.routes()
}
`;
};
const buildServices = (schema) => {
    let services = '';
    for (const svc of schema.queryServices) {
        services = services.concat(buildService(svc));
    }
    for (const svc of schema.mutationServices) {
        services = services.concat(buildService(svc));
    }
    return services;
};
const buildImports = (schema) => {
    const cbor = `
import {encodeAsync} from 'cbor'`;
    const useCbor = schema.hasCbor ? cbor : '';
    return `
import Koa from 'koa'
import Router, {Middleware} from '@koa/router'
${useCbor}
${ts_plugin_utils_1.buildMsgImports(schema.imports)}
  `;
};
const buildFile = (schema) => {
    const source = `
${buildImports(schema)}
${plugin_utils_1.fileHeader()}
${logger}
${ts_plugin_utils_1.buildTypes(schema)}
${ts_plugin_utils_1.buildInterfaces(schema)}
${buildServices(schema)}
`;
    return { fileName: schema.fileName + '.ts', source };
};
const buildServerOptsType = (schemas) => {
    let services = '';
    for (const schema of schemas) {
        for (const svc of schema.queryServices) {
            services = services.concat(`${plugin_utils_1.lowerCase(svc.name)}: ${plugin_utils_1.capitalize(svc.name)},
      `);
        }
        for (const svc of schema.mutationServices) {
            services = services.concat(`${plugin_utils_1.lowerCase(svc.name)}: ${plugin_utils_1.capitalize(svc.name)},
      `);
        }
    }
    return `
type ServerOptions = {
  port: number
  hostname?: string
  backlog?: number
  callback?: (...args: any[]) => void
  middleware?: Middleware<Koa.ParameterizedContext>[]
  ${services}
}
`;
};
const buildRoutesMiddleware = (schemas) => {
    let middleware = '';
    for (const schema of schemas) {
        for (const svc of schema.queryServices) {
            middleware = middleware.concat(`${plugin_utils_1.capitalize(svc.name)}(opts.${plugin_utils_1.lowerCase(svc.name)}), `);
        }
        for (const svc of schema.mutationServices) {
            middleware = middleware.concat(`${plugin_utils_1.capitalize(svc.name)}(opts.${plugin_utils_1.lowerCase(svc.name)}), `);
        }
    }
    return middleware;
};
const buildServer = (schemas) => {
    let imports = '';
    for (const schema of schemas) {
        for (const svc of schema.queryServices) {
            imports = imports.concat(`import {${plugin_utils_1.capitalize(svc.name)}} from './${schema.fileName}'
      `);
        }
        for (const svc of schema.mutationServices) {
            imports = imports.concat(`import {${plugin_utils_1.capitalize(svc.name)}} from './${schema.fileName}'
      `);
        }
    }
    const source = `
import Koa, {Middleware} from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from '@koa/router'
import cborParser from 'koa-cbor-bodyparser'
import koaQs from 'koa-qs'
import koaHelmet from 'koa-helmet'
import cors from '@koa/cors'
import * as http from 'http'
import logger from 'koa-logger'
${imports}

${buildServerOptsType(schemas)}

export const runServer = (opts: ServerOptions): http.Server => {
	const app = koaQs(new Koa())
	const middlewares = [bodyParser(), cborParser(), koaHelmet(), logger(),cors(),...opts.middleware, ${buildRoutesMiddleware(schemas)}]
	middlewares.forEach(mddlwr => app.use(mddlwr))
	return app.listen(opts.port, opts.hostname, opts.backlog, opts.callback)
}
  `;
    return { fileName: 'server.ts', source };
};
// builds all schemas and server file
const build = (schemas) => [...schemas.map((schema) => buildFile(schema)), buildServer(schemas)];
exports.testing = {
    buildDestructuredParams,
};
exports.default = build;
//# sourceMappingURL=index.js.map