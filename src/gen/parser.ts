import {outputFile} from 'fs-extra'
import {InterfaceDeclaration, MethodSignature, Project} from 'ts-morph'
import * as TJS from 'typescript-json-schema'
import {Generator} from './generator'

export class Parser {
  public readonly project: Project

  private get program() {
    return TJS.getProgramFromFiles(this.sourceFiles.map(file => file.getFilePath()))
  }

  public get sourceFiles() {
    return this.project.getSourceFiles()
  }

  public get jsonSchemaGenerator() {
    return TJS.buildGenerator(this.program)
  }

  constructor(private readonly tsConfigFilePath: string) {
    this.project = new Project({tsConfigFilePath: this.tsConfigFilePath})
  }

  getMethods(interfce: InterfaceDeclaration) {
    return interfce.getMethods()
  }

  getParams(method: MethodSignature) {
    return method.getParameters()
  }

  getReturns(method: MethodSignature) {
    return method.getReturnType()
  }

  getMethodName(method: MethodSignature) {
    return method.getName()
  }
}

const createSchemas = (project: Project) => {
  return files.map(file => new Generator(file.getBaseName(), gen, file.getInterfaces(), file.getTypeAliases(), file.getEnums()))
}

export const generateClient1 = async (tsConfigFilePath: string, outputPath: string) => {
  const project = new Project({tsConfigFilePath})
  const schemas = createSchemas(project)
  schemas.forEach(async schema => {
    await outputFile(`${outputPath}/${schema.fileName}`, schema.getOutput())
  })
}
