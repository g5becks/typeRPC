import {pathExists} from 'fs-extra'

export const tsConfigExists = async (path: string) => {
  try {
    const exists = await pathExists(path)
    return exists
  } catch (error) {
    return `error occurred: ${error}, failed to check if tsconfig file exists`
  }
}
