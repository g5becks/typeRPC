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

import { PluginManager as Manager } from 'live-plugin-manager'
import { Project } from 'ts-morph'
import * as fs from 'fs'
import { TypeRpcPlugin } from '@typerpc/plugin'
import { PluginConfig } from '@typerpc/config'

const sanitize = (plugin: string): string => (plugin.startsWith('/') ? plugin.substring(1).trim() : plugin.trim())

export const isValidPlugin = (plugin: any): plugin is TypeRpcPlugin =>
    typeof plugin === 'function' || ('default' in plugin && typeof plugin.default === 'function')

export const isPluginConfig = (config: any): config is PluginConfig =>
    'name' in config && 'version' in config && 'from' in config

export class PluginManager {
    readonly #manager: Manager
    readonly #pluginsPath: string

    private constructor(pluginsPath: string, cwd: string) {
        this.#pluginsPath = pluginsPath
        this.#manager = new Manager({ pluginsPath, cwd })
    }

    static create(project: Project): PluginManager {
        const cwd = project.getRootDirectories()[0].getPath()
        return new PluginManager(cwd + '/.typerpc/plugins', cwd)
    }

    private pluginPath(plugin: string): string {
        return `${this.#pluginsPath}/${sanitize(plugin)}`
    }

    private pluginIsInstalled(plugin: string): boolean {
        return fs.existsSync(this.pluginPath(plugin))
    }

    private async installPlugin(
        plugin: string | PluginConfig,
        log: { onInstalled: (plugin: string) => void; onInstalling: (plugin: string) => void },
    ): Promise<void> {
        if (!isPluginConfig(plugin)) {
            if (this.pluginIsInstalled(plugin)) {
                log.onInstalled(plugin)
                await this.#manager.installFromPath(this.pluginPath(plugin))
            } else {
                log.onInstalling(plugin)
                await this.#manager.installFromNpm(sanitize(plugin))
            }
        } else {
            if (plugin.from && plugin.from === 'github') {
                log.onInstalling(plugin.location)
                await this.#manager.installFromGithub(plugin.location)
            }
            if (plugin.from && plugin.from === 'filepath') {
                await this.#manager.installFromPath(plugin.location)
            }
            await this.#manager.installFromNpm(plugin.location, plugin.version ?? 'latest')
        }
    }
    opts = () => JSON.stringify(this.#manager.options)
    list = () => JSON.stringify(this.#manager.list())
    async install(
        plugins: string[],
        onInstalled: (plugin: string) => void,
        onInstalling: (plugin: string) => void,
    ): Promise<void[]> {
        return Promise.all(plugins.map((plugin) => this.installPlugin(plugin, { onInstalling, onInstalled })))
    }
    require(plugin: string): TypeRpcPlugin | Error {
        const plug = this.#manager.require(plugin)
        return isValidPlugin(plug)
            ? typeof plug === 'function'
                ? plug
                : plug['default']
            : // TODO point to a specific doc when available
              new Error(`${plugin} is not a valid typerpc plugin. Please see https://typerpc.run for more info`)
    }
}
