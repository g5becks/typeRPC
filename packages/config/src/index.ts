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

/**
 * A plugin to install that will be used for code generation.
 * Plugins can be installed location npm, github, or a filepath.
 * If the plugin lives on github or npm, the plugin name MUST begin
 * with either @typerpc or typerpc-plugin . Plugins installed location a
 * filepath have no such restrictions
 *
 * @property {string} name
 * @property {string} version
 * @property {'github' | 'npm' | 'filepath'} location
 */
export type PluginConfig = {
    /** name of the plugin to install
     * if using npm, simply supply the name of the package
     * if using github you may specify in the format owner/repository_name or
     * owner/repository_name#ref to specify a version
     * E.G. typerpc-plugin/someplugin#351396f
     * if using a filepath provide the filepath to the plugin node_modules folder is excluded location source name
     * */
    name: string
    /** If using npm, you can specify a version like 1.0.3 .
     * defaults to 'latest' if not specified */
    version?: string
    /** specify where to install this plugin is located. defaults to npm if not specified */
    location?: 'github' | 'npm' | 'filepath'
}
/**
 * Config options for code generation
 *
 * @property {string} out
 * @property {string} plugin
 * @property {string} pkg
 * @property {string| undefined} fmt
 **/
export type GeneratorConfig = Readonly<{
    /** directory to write generated code **/
    out: string
    /** name of the typerpc plugin to use or a PluginConfig object
     * if a string is used, the latest version of the plugin will be installed
     * location npm **/
    plugin: PluginConfig
    /** package name to use in generated code **/
    pkg: string
    /**
     * A string that will be used to execute
     * the code fmt of choice.
     * Generated code in out will be passed
     * as an argument this string.
     *
     * E.G. 'prettier --single-quote --trailing-comma es5 --no-semi --parser typescript --write'
     * **/
    fmt?: string
    /** package name to use in generated code **/
}>

export type Config = { [key: string]: GeneratorConfig }
