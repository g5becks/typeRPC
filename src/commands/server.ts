import {Command, flags} from '@oclif/command'
import {generateServer, tsConfigExists} from '../gen'
import {isValidServerFrameworkOption, ServerFrameworkOption} from '../gen/server'

export default class Server extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for schema project'}),
    output: flags.string({char: 'o', name: 'output', description: 'path to output directory for generated files'}),
    framework: flags.string({char: 'f', name: 'framework', description: 'which framework to use for generating the server code. Option are express | koa | fastify'}),

  }

  async run(): Promise<void> {
    const {flags} = this.parse(Server)

    const tsConfig = flags.tsConfig ?? ''
    const outputPath = flags.output ?? ''
    const serverFramework = flags.framework ?? ''
    await this.validateTsConfigFile(tsConfig)
    this.validateServerFramework(serverFramework)
    const code = await generateServer(tsConfig, serverFramework as ServerFrameworkOption)
  }

  private async validateTsConfigFile(tsConfigFile: string): Promise<void> {
    const exists = await tsConfigExists(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
      this.log('error: please provide a path to a valid tsconfig.json file')
      throw new Error('tsconfig.json is invalid or does not exist')
    }
  }

  private async validateServerFramework(framework: string): Promise<void> {
    if (!isValidServerFrameworkOption(framework)) {
      this.log(`sorry ${framework} is not a valid server framework option or has not yet been implemented`)
      throw new Error('bad server framework option')
    }
  }
}
