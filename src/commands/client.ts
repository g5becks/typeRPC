import {Command, flags} from '@oclif/command'
import {pathExists} from 'fs-extra'
import {generateClient} from '../gen/parser'

export default class Client extends Command {
  static description = 'generates client side code from your schemas'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    configPath: flags.string({char: 'c', name: 'config', description: 'path to schemas dir'}),
    output: flags.string({char: 'o', name: 'output', description: 'directory to place generated outputs'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Client)
    const config = flags.configPath ?? ''
    const output = flags.output ?? ''
    const doesExist = await pathExists(config)
    if (!doesExist) {
      this.log('sorry, that path does not exist')
    }
    await generateClient(config, output)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
