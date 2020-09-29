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

import { GeneratorConfig, PluginConfig, PluginLocation } from '@typerpc/config'
import chalk from 'chalk'
import { ChildProcess, exec } from 'child_process'
import { appendFileSync } from 'fs'
import * as fs from 'fs-extra'
import { outputFile } from 'fs-extra'
import { render } from 'prettyjson'
import { ObjectLiteralExpression, Project, SourceFile, SyntaxKind } from 'ts-morph'
import { ILogObject, Logger } from 'tslog'

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
        if (location?.getProperty('github')) {
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
        if (location?.getProperty('local')) {
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
    if (!out || !pkg) {
        throw new Error(`
        error in config file: ${obj.getSourceFile().getFilePath()},
        at line number: ${obj.getStartLineNumber()},
        message: all generator config objects must contain the following properties: missing config property : ${
            out ? 'pkg' : 'out'
        } [out, plugin, pkg]`)
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
    const logToFile = (logObject: ILogObject) => {
        appendFileSync(
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

export const getRpcConfigPath = (file: SourceFile | undefined): string | undefined => {
    if (!file) {
        return file
    }
    return file.getDirectory().getPath().toString().trim()
}

const gitIgnore = `
*-debug.log
*-error.log
/.nyc_output
/lib
/package-lock.json
/tmp
node_modules
output
packages/examples/api
/client

IntelliJ IDEAPhpStormWebStorm
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage

# nyc test coverage
.nyc_output

# Grunt intermediate storage (http://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
generate/Release

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js generate output
.next


# Editor-specific metadata folders
.vs

.DS_Store
.idea
_ts3.4
*.tsbuildinfo
.watchmanconfig
`

const prettierIgnore = `
# Created by .ignore support plugin (hsz.mobi)
### Node template
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
generate/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js generate output
.next
out

# Nuxt.js generate / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress generate output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/generate-state.yml
.yarn/install-state.gz
.pnp.*
`
const tsconfigFile = `
{
  "compilerOptions": {
    "noEmit": true,
    "strict": true,
    "strictFunctionTypes": false,
    "forceConsistentCasingInFileNames": true
  },
    "include": [
    "./*.ts",
    "./src/*.ts"
  ]
}
`

const eslintrc = `
module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
    rules: {},
}
`
const editorConfig = `
root = true

[*]
indent_style = space
indent_size = 2
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
`
const prettierrc = `
module.exports = {
  semi: false,
  trailingComma: "all",
  singleQuote: true,
  printWidth: 120,
  tabWidth: 4
};
`

const rpcConfig = (client?: string, server?: string) => `
import {Config} from '@typerpc/config'

// edit the fields below to your liking to generate your desired code.
const config: Config = {
	// config object for client side code
	client: {
		// path to store generated outputs. Can be relative E.G. ./client | .\\client
		// or absolute E.G. /home/machine/development/client | C:\\Users\\username\\development\\client
		out: '${client ?? ''}',
		// a valid PluginConfig object, this plugin will be used to generate code for the client key
		plugin: {
			// the name of the plugin to use for generating code.
			// all plugin names must start with either @typerpc or typerpc-plugin
			// this makes searching for plugins on github and npm a breeze.
			name: '@typerpc/ts-axios',
			/* optional location of the plugin. This key is only needed if the plugin is not hosted on npm
			location: {
				// set the local key if using a plugin that is located on disk. useful for development
				// path can be relative './some-plugin-im-making/dir' or can be absolute.
				// the path may NOT be in a node_modules folder, and the path must contain a package.json
				// file with a name key matching the name key used above.
				local: '/home/Dev/some_path/typerpc-plugin-some-neat-plugin-name'

				// or set the github key to download the plugin from github.
				// repository can be specified in the format owner/repository_name#ref
				// E.G. mygithubusername/my-special-plugin#351396f
				github: 'owner/repository_name'
			},

			 */

		},
		// name of the package for the generated output
		// E.G. 'rpc' for go perhaps, or 'com.myorg.somepackage' for java
		// this field is not currently used for ts/js but may be in future versions
		// so it is required nonetheless
		pkg: '',
		// a string to use for formatting the generated output
		// E.G. 'prettier --single-quote --no-semi --trailing-comma all --write'
		// do not include a path, this will be added at runtime.
		fmt: ''
	},

	server: {
		out: '${server ?? ''}',
		plugin: { name: '@typerpc/go-chi' },
		// name of the package for the generated output
		pkg: 'rpc',
		// a string to use for formatting the generated output
		fmt: 'gofmt -d -s -w'
	},
	// There is no limit on the number of configs you set.
	// Feel free to generate code for as many targets as you need
	/*
	ios: {
		out: '',
		plugin: {name: ''},
		pkg: ''
	},
	android: {
		out: '',
		plugin: {name: ''},
		pkg: ''
	},
	microservice1: {
		out: '',
		plugin: {name: ''},
		pkg: ''
	},
	microservice2: {
		out: '',
		plugin: {name: ''},
		pkg: ''
	}

	 */

}
`
const packageJson = (name: string) => `
{
  "name": "${name}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "typerpc gen -t ./tsconfig.json"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@typerpc/config": "^0.1.6",
    "@typerpc/types": "^0.1.2",
    "@typescript-eslint/eslint-plugin": "^4.1.1",
    "@typescript-eslint/parser": "^4.1.1",
    "eslint": "^7.9.0",
    "eslint-config-prettier": "^6.11.0",
    "eslint-plugin-prettier": "^3.1.4",
    "prettier": "^2.1.2",
    "typescript": "^4.0.2"
  }
}
`

const exampleSource = `
import { $, rpc } from '@typerpc/types'

type User = rpc.Msg<{
    id: $.int8
    name: $.str
    age: $.int8
    weight: $.float32
    verified: $.bool
    // embeddedMsg: SomeMessage
    embeddedMsgLiteral: rpc.Msg<{
        cool: $.list<$.bool>
    }>
    nested: rpc.Msg<{
        /* embedded rpc.Msg literal can't be nested. Declare another type instead
      tryToNest: rpc.Msg<{
        fail: $.str
      }>

       */
    }>
    // norrmal typescript types can't be used uncomment the code below
    // fail: string
}>

type ExampleService = rpc.QuerySvc<{
    getUserById(id: $.int8): User
    getUsersBelowAge(age: $.int8): $.list<User>
}>

type MutationService = rpc.MutationSvc<{
    addUser(user: User): User
    updateUser(user: User): $.bool
}>

`
export const scaffold = async (
    projectName: string,
    yarn?: boolean,
    client?: string,
    server?: string,
): Promise<void> => {
    const files = [
        { fileName: `package.json`, source: packageJson(projectName) },
        { fileName: 'rpc.config.ts', source: rpcConfig(client, server) },
        { fileName: '.prettierrc.js', source: prettierrc },
        { fileName: '.prettierignore', source: prettierIgnore },
        { fileName: '.editorconfig', source: editorConfig },
        { fileName: '.eslintrc.js', source: eslintrc },
        { fileName: 'tsconfig.json', source: tsconfigFile },
        { fileName: '.gitignore', source: gitIgnore },
        { fileName: './src/example.ts', source: exampleSource },
    ]
    let promises: Promise<void>[] = []
    for (const file of files) {
        promises = [...promises, outputFile(`./${projectName}/${file.fileName}`, file.source)]
    }
    await Promise.allSettled(promises)
    exec(`cd ./${projectName} && ${yarn ? 'yarn' : 'npm'} install`, (error, stdout, stderr) => {
        if (error) {
            console.log(chalk.red(`error occurred: ${error}`))
            return
        }
        if (stderr) {
            console.log(chalk.red(`error occurred: ${stderr}`))
            return
        }

        console.log(`project ${projectName} created! Thanks for using typerpc. Happy Hacking. ${stdout}`)
    })
}
