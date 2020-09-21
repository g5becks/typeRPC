#!/usr/bin/env node
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
import yargs from 'yargs'
import { gen } from './commands/gen'
import chalk from 'chalk'
import figlet from 'figlet'
import { create } from './commands/create'

console.log(chalk.blue(figlet.textSync('typerpc')))

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('yargonaut').help('3D-ASCII').helpStyle('green').errors('Calvin S').errorsStyle('red')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const argv = yargs
    .command(gen)
    .command(create)
    .demandCommand(1, 'You must supply a command to use typerpc')
    .example('gen', '')
    .example('create', '')
    .help()
    .epilogue('for more information, please visit https://typerpc.run').argv

console.log(`typerpc running with with ${argv}`)
