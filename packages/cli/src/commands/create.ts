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

import yargs, { CommandModule } from 'yargs'

type Args = Readonly<
    Partial<{
        name: string
        client: string
        server: string
    }>
>

const tsconfigFile = `
{
  "compilerOptions": {
    "noEmit": true,
    "strict": true,
    "strictFunctionTypes": false,
    "forceConsistentCasingInFileNames": true
  }
}
`

const rpcConfig = (client?: string, server?: string) => `
import {Config} from '@typerpc/config'

// edit the fields below to your liking to generate your desired code.
const config: Config = {
	// config object for client side code, this key can be named whatever you like
	// but be sure to make it self explanatory
	client: {
		// path to store generated outputs. Can be relative E.G. ./client | .\\client
		// or absolute E.G. /home/machine/development/client | C:\\Users\\username\\development\\client
		out: '',
		// a valid PluginConfig object, this plugin will be used to generate code for the client key
		plugin: {
			// the name of the plugin to use for generating code.
			// all plugin names must start with either @typerpc or typerpc-plugin
			// this makes searching for plugins on github and npm a breeze.
			name: '${client ?? ''}',
			/* optional location of the plugin. This key is only needed if the plugin is not hosted on npm
			location: {
				// set the local key if using a plugin that is located on disk. useful for development. E.G. /home/Dev/some_path/typerpc-plugin-some-neat-plugin-name
				local: ''

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
		// a string to use for formatting the generated client output
		// E.G. 'prettier --single-quote --no-semi --trailing-comma all --write'
		// do not include a path, this will be added at runtime.
		fmt: ''
	},

	server: {

		out: './server',
		plugin: { name: ${server} ?? ''},
		// name of the package for the generated output
		pkg: 'rpc',
		// a string to use for formatting the generated output
		fmt: 'gofmt -d -s -w'
	}

}
`
const handler = (args: Args) => {
    const { name, client, server } = args
    if (!name) {
        throw new Error(`name must be provided when using the create command`)
    }
}
export const create: CommandModule<Record<string, unknown>, Args> = {
    command: 'create',
    describe: 'creates a new typerpc application',
    builder: (_) => {
        return yargs
            .positional('name', {
                alias: 'n',
                type: 'string',
                demandOption: true,
                description: 'name of the project to create',
            })
            .options({
                client: {
                    alias: 'c',
                    type: 'string',
                    description: 'name of the plugin to use for client side code generation',
                },
                server: {
                    alias: 's',
                    type: 'string',
                    description: 'name of the plugin to use for server side code generation',
                },
            })
    },
    handler,
}
