import {Command, flags} from '@oclif/command'

export default class Server extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for schema project'}),
    output: flags.string({char: 'o', name: 'output', description: 'path to output directory for generated files'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Server)

    const tsConfig = flags.tsConfig ?? ''
    this.log(`hello ${name} from /home/beckspoppn/Dev/typeRPC/src/commands/server.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
