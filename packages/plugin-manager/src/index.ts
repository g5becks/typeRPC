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

export const isPluginConfig = (config: Record<string, unknown>): config is PluginConfig =>
    'name' in config && 'version' in config && 'location' in config

export const isGitHub = (location: any): location is { github: string } =>
    typeof location === 'object' && 'github' in location

export const isLocal = (location: any): location is { local: string } =>
    typeof location === 'object' && 'local' in location

export class PluginManager {
    private readonly manager: Manager
    private readonly pluginsPath: string

    private constructor(pluginPath: string, cwd: string) {
        this.pluginsPath = pluginPath
        this.manager = new Manager({ pluginsPath: pluginPath, cwd })
    }

    static create(project: Project): PluginManager {
        const cwd = project.getRootDirectories()[0].getPath()
        return new PluginManager(cwd + '/.typerpc/plugins', cwd)
    }

    private pluginPath(plugin: string): string {
        return `${this.pluginsPath}/${sanitize(plugin)}`
    }

    private pluginIsInstalled(plugin: string): boolean {
        return fs.existsSync(this.pluginPath(plugin))
    }

    private async installPlugin(
        plugin: PluginConfig,
        log: { onInstalled: (plugin: string) => void; onInstalling: (plugin: string) => void },
    ): Promise<void> {
        if (!isPluginConfig(plugin)) {
            throw new Error(`${JSON.stringify(plugin)} is not a valid typerpc plugin`)
        }
        if (this.pluginIsInstalled(this.pluginPath(plugin.name))) {
            log.onInstalled(plugin.name)
            await this.manager.installFromPath(this.pluginPath(plugin.name))
        }
        log.onInstalling(plugin.name)
        if (typeof plugin.location !== 'undefined' && plugin.location !== 'npm') {
            if (isGitHub(plugin.location)) {
                await this.manager.installFromGithub(plugin.location.github)
            }
            if (isLocal(plugin.location)) {
                await this.manager.installFromPath(plugin.location.local)
            }
        } else if (plugin.location === 'npm') {
            await this.manager.installFromNpm(plugin.name, plugin.version ?? 'latest')
        } else {
            console.log('plugin has invalid location field')
        }
    }

    opts = (): string => JSON.stringify(this.manager.options)
    list = (): string => JSON.stringify(this.manager.list())
    async install(
        plugins: PluginConfig[],
        onInstalled: (plugin: string) => void,
        onInstalling: (plugin: string) => void,
    ): Promise<void> {
        for (const plugin of plugins) {
            await this.installPlugin(plugin, { onInstalling, onInstalled })
        }
    }
    require(plugin: string): TypeRpcPlugin | Error {
        const plug = this.manager.require(plugin)
        return isValidPlugin(plug)
            ? typeof plug === 'function'
                ? plug
                : plug['default']
            : // TODO point to a specific doc when available
              new Error(`${plugin} is not a valid typerpc plugin. Please see https://typerpc.run for more info`)
    }
}
