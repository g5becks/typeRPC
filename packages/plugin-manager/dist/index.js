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
var _manager, _pluginsPath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = exports.isValidPlugin = void 0;
const tslib_1 = require("tslib");
const live_plugin_manager_1 = require("live-plugin-manager");
const fs = tslib_1.__importStar(require("fs"));
const sanitize = (plugin) => (plugin.startsWith('/') ? plugin.substring(1).trim() : plugin.trim());
exports.isValidPlugin = (plugin) => typeof plugin === 'function';
class PluginManager {
    constructor(pluginsPath) {
        _manager.set(this, void 0);
        _pluginsPath.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _pluginsPath, pluginsPath);
        tslib_1.__classPrivateFieldSet(this, _manager, new live_plugin_manager_1.PluginManager({ pluginsPath, ignoredDependencies: [new RegExp('[sS]*')] }));
    }
    static create(project) {
        return new PluginManager(project.getRootDirectories()[0].getPath() + '/.typerpc/plugins');
    }
    pluginPath(plugin) {
        return `${tslib_1.__classPrivateFieldGet(this, _pluginsPath)}/${sanitize(plugin)}`;
    }
    pluginIsInstalled(plugin) {
        return fs.existsSync(this.pluginPath(plugin));
    }
    async installPlugin(plugin, log) {
        if (this.pluginIsInstalled(plugin)) {
            log.onInstalled(plugin);
            await tslib_1.__classPrivateFieldGet(this, _manager).installFromPath(this.pluginPath(plugin));
        }
        else {
            log.onInstalling(plugin);
            await tslib_1.__classPrivateFieldGet(this, _manager).install(sanitize(plugin));
        }
    }
    async install(plugins, onError, onInstalled, onInstalling) {
        try {
            await Promise.all(plugins.map((plugin) => this.installPlugin(plugin, { onInstalling, onInstalled })));
        }
        catch (error) {
            onError(error);
        }
    }
    require(plugin) {
        const plug = tslib_1.__classPrivateFieldGet(this, _manager).require(plugin);
        return exports.isValidPlugin(plug)
            ? plug
            : new Error(`${plugin} is either an invalid typerpc plugin name, or has an incorrect implementation`);
    }
}
exports.PluginManager = PluginManager;
_manager = new WeakMap(), _pluginsPath = new WeakMap();
//# sourceMappingURL=index.js.map