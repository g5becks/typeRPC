import { PluginManager as Manager } from 'live-plugin-manager'
import { Project } from 'ts-morph'
import * as fs from 'fs'
import { TypeRpcPlugin } from '@typerpc/plugin'

const sanitize = (plugin: string): string => (plugin.startsWith('/') ? plugin.substring(1).trim() : plugin.trim())

const isValidPlugin = (plugin: any) =>
    'scaffold' in plugin &&
    'generate' in plugin &&
    typeof plugin.scaffold === 'function' &&
    typeof 'generate' === 'function'

class PluginManager {
    readonly #manager: Manager
    readonly #pluginsPath: string

    private constructor(pluginsPath: string) {
        this.#pluginsPath = pluginsPath
        this.#manager = new Manager({ pluginsPath, ignoredDependencies: [new RegExp('[sS]*')] })
    }

    static create(project: Project): PluginManager {
        return new PluginManager(project.getRootDirectories()[0].getPath() + '/.typerpc/plugins')
    }

    pluginPath(plugin: string): string {
        return `${this.#pluginsPath}/${sanitize(plugin)}`
    }

    pluginIsInstalled(plugin: string): boolean {
        return fs.existsSync(this.pluginPath(plugin))
    }

    private async installPlugin(
        plugin: string,
        log: { onInstalled: (plugin: string) => void; onInstalling: (plugin: string) => void },
    ): Promise<void> {
        if (this.pluginIsInstalled(plugin)) {
            log.onInstalled(plugin)
            await this.#manager.installFromPath(this.pluginPath(plugin))
        } else {
            log.onInstalling(plugin)
            await this.#manager.install(sanitize(plugin))
        }
    }

    async install(
        plugins: string[],
        onError: (error: Error) => void,
        log: { onInstalled: (plugin: string) => void; onInstalling: (plugin: string) => void },
    ): Promise<void> {
        try {
            await Promise.all(plugins.map((plugin) => this.installPlugin(plugin, log)))
        } catch (error) {
            onError(error)
        }
    }
    require(plugin: string): TypeRpcPlugin | Error {
        const plug = this.#manager.require(plugin)
        return isValidPlugin(plug)
            ? plug
            : new Error(`${plugin} is either an invalid typerpc plugin name, or has an incorrect implementation`)
    }
}
