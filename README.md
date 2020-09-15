
@typerpc/cli
============

Cross Language Rpc Framework

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@typerpc/cli.svg)](https://npmjs.org/package/@typerpc/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@typerpc/cli.svg)](https://npmjs.org/package/@typerpc/cli)
[![License](https://img.shields.io/npm/l/@typerpc/cli.svg)](https://github.com/typerpc/cli/blob/master/package.json)
[![Known Vulnerabilities](https://snyk.io/test/github/typerpc/typerpc/badge.svg?targetFile=package.json)](https://snyk.io/test/github/typerpc/typerpc?targetFile=package.json)
<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @typerpc/cli
$ typerpc COMMAND
running command...
$ typerpc (-v|--version|version)
@typerpc/cli/1.0.1 linux-x64 node-v12.18.2
$ typerpc --help [COMMAND]
USAGE
  $ typerpc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`typerpc hello [FILE]`](#typerpc-hello-file)
* [`typerpc help [COMMAND]`](#typerpc-help-command)

## `typerpc hello [FILE]`

describe the command here

```
USAGE
  $ typerpc hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ typerpc hello
  hello world plugin ./src/create.ts!
```

_See code: [src/commands/create.ts](https://github.com/typerpc/cli/blob/v1.0.1/src/commands/hello.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_
<!-- commandsstop -->
