import {InterfaceDeclaration, MethodSignature, Project, SourceFile} from 'ts-morph'
import * as TJS from 'typescript-json-schema'

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

  getFileName(file: SourceFile)  {
    return file.getBaseName()
  }

  getInterfaces(file: SourceFile) {
    return file.getInterfaces()
  }

  getTypeAliases(file: SourceFile) {
    return file.getTypeAliases()
  }
}

