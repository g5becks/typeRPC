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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _manager, _pluginsPath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = exports.isValidPlugin = void 0;
const live_plugin_manager_1 = require("live-plugin-manager");
const fs = __importStar(require("fs"));
const sanitize = (plugin) => (plugin.startsWith('/') ? plugin.substring(1).trim() : plugin.trim());
exports.isValidPlugin = (plugin) => typeof plugin === 'function';
class PluginManager {
    constructor(pluginsPath, cwd) {
        _manager.set(this, void 0);
        _pluginsPath.set(this, void 0);
        this.opts = () => JSON.stringify(__classPrivateFieldGet(this, _manager).options);
        this.list = () => JSON.stringify(__classPrivateFieldGet(this, _manager).list());
        __classPrivateFieldSet(this, _pluginsPath, pluginsPath);
        __classPrivateFieldSet(this, _manager, new live_plugin_manager_1.PluginManager({ pluginsPath, cwd }));
    }
    static create(project) {
        const cwd = project.getRootDirectories()[0].getPath();
        return new PluginManager(cwd + '/.typerpc/plugins', cwd);
    }
    pluginPath(plugin) {
        return `${__classPrivateFieldGet(this, _pluginsPath)}/${sanitize(plugin)}`;
    }
    pluginIsInstalled(plugin) {
        return fs.existsSync(this.pluginPath(plugin));
    }
    async installPlugin(plugin, log) {
        if (this.pluginIsInstalled(plugin)) {
            log.onInstalled(plugin);
            await __classPrivateFieldGet(this, _manager).installFromPath(this.pluginPath(plugin));
        }
        else {
            log.onInstalling(plugin);
            await __classPrivateFieldGet(this, _manager).installFromNpm(sanitize(plugin));
        }
    }
    async install(plugins, onInstalled, onInstalling) {
        await Promise.all(plugins.map((plugin) => this.installPlugin(plugin, { onInstalling, onInstalled })));
    }
    require(plugin) {
        const plug = __classPrivateFieldGet(this, _manager).require(plugin);
        if (exports.isValidPlugin(plug)) {
            return plug;
        }
        if (plug instanceof Error) {
            return plug;
        }
        return new Error(plug);
    }
}
exports.PluginManager = PluginManager;
_manager = new WeakMap(), _pluginsPath = new WeakMap();
//# sourceMappingURL=index.js.map