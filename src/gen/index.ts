/* eslint-disable @typescript-eslint/no-unused-vars */
import {getServerGenerator, ServerFrameWorkOption} from './server'

export const generateClient = async (tsConfigFilePath: string, client: ClientHttpOption) => {

}

export const generateServer = async (tsConfigFilePath: string, serverFrameWork: ServerFrameWorkOption) => {
  const serverGen = await getServerGenerator(serverFrameWork, tsConfigFilePath)
  if (typeof serverGen === 'string') {
    return serverGen
  }
  return serverGen.generate()
}
