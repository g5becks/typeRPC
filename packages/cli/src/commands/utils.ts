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
import { GeneratorConfig, PluginConfig, PluginLocation } from '@typerpc/config'
import { ChildProcess, exec } from 'child_process'
import * as fs from 'fs-extra'
import { appendFile } from 'fs-extra'
import { ILogObject, Logger } from 'tslog'
import { render } from 'prettyjson'

export const getConfigFile = (project: Project): SourceFile | undefined =>
    project.getSourceFile((file) => file.getBaseName().toLowerCase() === 'rpc.config.ts')

// get the value for the PluginConfig location property
const parsePluginLocation = (pluginConfig: ObjectLiteralExpression | undefined): PluginLocation => {
    // get location property
    const prop = pluginConfig?.getProperty('location')
    // get string if exists
    const propString = prop?.getChildrenOfKind(SyntaxKind.StringLiteral)
    // if string is npm return npm as location
    if (propString && propString[0]?.getLiteralValue().trim() === 'npm') {
        return 'npm'
    }
    // location is not string so must be objectLiteral
    const locationObj = prop?.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)
    // make sure it is defined
    if (locationObj && locationObj.length > 0) {
        // get first objectLiteral since there is only one
        const location = locationObj[0]
        // if github property exists
        if (location.getProperty('github')) {
            // return the string found or empty, let function up the stack
            // throw when empty string is found
            return {
                github:
                    location
                        ?.getProperty('github')
                        ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
                        ?.getLiteralValue()
                        ?.trim() ?? '',
            }
        }
        if (location.getProperty('local')) {
            return {
                local:
                    location
                        ?.getProperty('local')
                        ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
                        ?.getLiteralValue()
                        ?.trim() ?? '',
            }
        }
    }
    return 'npm'
}
const parseGeneratorConfig = (obj: ObjectLiteralExpression): GeneratorConfig => {
    const out = obj.getProperty('out')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()

    const pluginConfig = obj.getProperty('plugin')?.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0]
    const plugin: PluginConfig = {
        name:
            pluginConfig
                ?.getProperty('name')
                ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
                ?.getLiteralValue()
                ?.trim() ?? '',
        version:
            pluginConfig
                ?.getProperty('version')
                ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
                ?.getLiteralValue()
                ?.trim() ?? 'latest',
        location: parsePluginLocation(pluginConfig),
    }
    const pkg = obj.getProperty('pkg')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()

    const fmt = obj.getProperty('fmt')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()
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
    // parse object literal location the config var then get all properties
    const conf = file?.getVariableDeclaration('config')
    const props = conf
        ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression)
        ?.getChildrenOfKind(SyntaxKind.PropertyAssignment)
    // if there are no properties throw and exit
    if (typeof props === 'undefined') {
        throw new Error(`error in config file. Invalid config object, no generators found.`)
    }
    let configs: ParsedConfig[] = []
    // get the Generator config for each property assignment
    // pass is to the parseGeneratorConfig function along with the
    // name of the property the config belongs to
    for (const prop of props) {
        configs = configs.concat({
            ...parseGeneratorConfig(prop.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0]),
            configName: prop.getFirstChild()?.getText() ?? '',
        })
    }
    return configs
}

export const createLogger = (project: Project): Logger => {
    const dest = project.getRootDirectories()[0].getPath() + '/.typerpc/error.log'
    fs.ensureFileSync(dest)
    const logToFile = async (logObject: ILogObject) => {
        await appendFile(
            dest,
            render(logObject, { noColor: true }) +
                '\n---------------------------------------------------------------------------------------------------------------------------------------\n',
        )
    }
    const logger = new Logger()
    logger.attachTransport(
        {
            silly: logToFile,
            debug: logToFile,
            trace: logToFile,
            info: logToFile,
            warn: logToFile,
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
            onError(
                `Looks like there was an issue formatting your code. Are you sure you supplied a proper fmt argument? ${error}`,
            )
            return
        }
        if (stderr) {
            onError(
                `Looks like there was an issue formatting your code. Are you sure you supplied a proper fmt argument? ${error}`,
            )
            return
        }

        onComplete(`code formatting succeeded using formatter: ${formatter}, msg: ${stdout}`)
    })
