typeRPC
=======

Friendly Typescript Rpc Framework

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/typeRPC.svg)](https://npmjs.org/package/typeRPC)
[![Downloads/week](https://img.shields.io/npm/dw/typeRPC.svg)](https://npmjs.org/package/typeRPC)
[![License](https://img.shields.io/npm/l/typeRPC.svg)](https://github.com/getpoppn/typeRPC/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g typerpc
$ typerpc COMMAND
running command...
$ typerpc (-v|--version|version)
typerpc/0.0.1 linux-x64 node-v12.18.2
$ typerpc --help [COMMAND]
USAGE
  $ typerpc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`typerpc client [FILE]`](#typerpc-client-file)
* [`typerpc help [COMMAND]`](#typerpc-help-command)
* [`typerpc server [FILE]`](#typerpc-server-file)

## `typerpc client [FILE]`

describe the command here

```
USAGE
  $ typerpc client [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/client.ts](https://github.com/getpoppn/typeRPC/blob/v0.0.1/src/commands/client.ts)_

## `typerpc help [COMMAND]`

display help for typerpc

```
USAGE
  $ typerpc help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_

## `typerpc server [FILE]`

describe the command here

```
USAGE
  $ typerpc server [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/server.ts](https://github.com/getpoppn/typeRPC/blob/v0.0.1/src/commands/server.ts)_
<!-- commandsstop -->
