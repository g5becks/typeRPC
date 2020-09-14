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

import { ObjectLiteralExpression, Project, SourceFile, SyntaxKind } from 'ts-morph'
import { GeneratorConfig } from '@typerpc/config'
import { ChildProcess, exec } from 'child_process'
import { appendFile } from 'fs-extra'
import { ILogObject, Logger } from 'tslog'
import { render } from 'prettyjson'
import * as fs from 'fs-extra'

export const getConfigFile = (project: Project): SourceFile | undefined =>
    project.getSourceFile((file) => file.getBaseName().toLowerCase() === 'rpc.config.ts')
const parseGeneratorConfig = (obj: ObjectLiteralExpression): GeneratorConfig => {
    const out = obj.getProperty('out')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()

    const plugin = obj.getProperty('plugin')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()
    const pkg = obj.getProperty('pkg')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()

    const fmt = obj.getProperty('fmt')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()
    console.log(`outputpath = ${out}, plugin = ${plugin}, package = ${pkg}`)
    if (!out || !plugin || !pkg) {
        throw new Error(`
        error in config file: ${obj.getSourceFile().getFilePath()},
        at line number: ${obj.getStartLineNumber()},
        message: all generator config objects must contain the following properties: [outputPath, plugin, packageName]`)
    }

    return { out, plugin, pkg, fmt }
}
export type ParsedConfig = GeneratorConfig & { configName: string }
export const parseConfig = (file: SourceFile | undefined): ParsedConfig[] => {
    // parse object literal from the config var then get all properties
    const conf = file?.getVariableDeclaration('config')
    const props = conf
        ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression)
        ?.getChildrenOfKind(SyntaxKind.PropertyAssignment)
    // if there are no properties throw and exit
    if (typeof props === 'undefined') {
        throw new Error(`error in config file. Invalid config object, no generators found.`)
    }
    let configs: ParsedConfig[] = []
    // get the Generator config from each property assignment
    // pass is go the parseGeneratorConfig function
    for (const prop of props) {
        configs = configs.concat({
            ...parseGeneratorConfig(prop.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0]),
            configName: prop.getFirstChild()?.getText() ?? '',
        })
    }
    return configs
}

export const createLogger = async (project: Project): Promise<Logger> => {
    const dest = project.getRootDirectories()[0].getPath() + '/.typerpc/error.log'
    await fs.ensureFile(dest)
    const logToFile = (logObject: ILogObject) => {
        appendFile(dest, render(logObject) + '\n\n')
    }
    const logger = new Logger({ type: 'pretty' })
    logger.attachTransport(
        {
            silly: logger.silly,
            debug: logger.debug,
            trace: logger.trace,
            info: logger.info,
            warn: logger.warn,
            error: logToFile,
            fatal: logToFile,
        },
        'error',
    )
    return logger
}

export const format = (
    path: string,
    formatter: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => void,
    onComplete: (msg: string) => void,
): ChildProcess =>
    exec(`${formatter} ${path}`, (error, stdout, stderr) => {
        if (error) {
            onError(error)
            return
        }
        if (stderr) {
            onError(stderr)
            return
        }

        onComplete(`code formatting succeeded using formatter: ${formatter}, msg: ${stdout}`)
    })
