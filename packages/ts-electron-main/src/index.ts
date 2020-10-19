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

import { capitalize, lowerCase } from '@typerpc/plugin-utils'
import { MutationService, QueryService } from '@typerpc/schema'
import { buildInterfaces } from '@typerpc/ts-plugin-utils'

const buildService = (svc: MutationService | QueryService): string => {
    return `
  export const create${capitalize(svc.name)}(${lowerCase(svc.name)}: ${capitalize(svc.name)}, window: BrowserWindow)`
}

const buildFile = (schema: Schema): Code => {
    let types = ''
    for (const msg of schema.messages) {
        types = types.concat(buildType(msg).concat('\n' + buildMsgSchema(msg, schema.fileName)))
    }
    const source = `

    ${types}
    ${buildInterfaces(schema)}
    `
    return { fileName: schema.fileName + '.ts', source }
}

// builds all schemas and server file
const build = (schemas: Schema[]): Code[] => [...schemas.map((schema) => buildFile(schema))]

export default build
