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

export type PluginLocation = 'npm' | { github: string } | { local: string }
/**
 * A plugin to install that will be used for code generation.
 * Plugins can be installed from npm, github, or a local filepath.
 * All plugin names MUST begin with either @typerpc or typerpc-plugin .
 *
 * @property {string} name
 * @property {string} version
 * @property {PluginLocation} location
 */
export type PluginConfig = {
    /** name of the plugin package to install */
    name: string
    /** If the plugin's location is npm, you can specify a version like 1.0.3 .
     * defaults to 'latest' if not specified */
    version?: string
    /** specify where the plugin to install is located.
     * For using github specify in the format {github: 'owner/repository_name' } or
     * owner/repository_name#ref to specify a version E.G. {github: 'typerpc-plugin/someplugin#351396f'} .
     * For local plugins provide the filepath to the directory containing the
     * package.json file for the plugin. E.G. {local: '/machine/development/plugin'}, node_modules folder is not allowed. If no location is provided the plugin
     * will be downloaded from npm. */
    location?: PluginLocation
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
