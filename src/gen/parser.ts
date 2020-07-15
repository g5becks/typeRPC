import {outputFile} from 'fs-extra'
import {InterfaceDeclaration, MethodSignature, Project} from 'ts-morph'
import * as TJS from 'typescript-json-schema'
import {Generator} from './generator'
export const getMethods = (interfce: InterfaceDeclaration) => interfce.getMethods()

export const getParams = (method: MethodSignature) => method.getParameters()

export const getReturns = (method: MethodSignature) => method.getReturnType()

export const getMethodName = (method: MethodSignature) => method.getName()

const createSchemas = (project: Project) => {
  const files = project.getSourceFiles()
  const program = TJS.getProgramFromFiles(files.map(file => file.getFilePath()))
  const gen = TJS.buildGenerator(program)
  return files.map(file => new Generator(file.getBaseName(), file.getFilePath(), gen, file.getInterfaces(), file.getTypeAliases(), file.getEnums()))
}

export const generateClient = async (tsConfigFilePath: string, outputPath: string) => {
  const project = new Project({tsConfigFilePath})
  const schemas = createSchemas(project)
  schemas.forEach(async schema => {
    await outputFile(`${outputPath}/${schema.fileName}`, schema.getOutput())
  })
}
