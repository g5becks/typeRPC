import {ClientGenerator} from './generator'

export const generateClient = async (gen: ClientGenerator) => {
  await gen.generate()
}
