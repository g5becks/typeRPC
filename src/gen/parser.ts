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

  getMethodsForInterface(interfce: InterfaceDeclaration) {
    return interfce.getMethods()
  }

  getMethodsForFile(file: SourceFile) {
    const interfaces = this.getInterfaces(file)
    const methods: MethodSignature[] = []
    interfaces.forEach(interfc => methods.push(...this.getMethodsForInterface(interfc)))
    return methods
  }

  getParams(method: MethodSignature) {
    return method.getParameters()
  }

  getMethodReturnType(method: MethodSignature) {
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

  getAllReturnTypes(file: SourceFile) {
    return this.getMethodsForFile(file).map(method => this.getMethodReturnType(method))
  }
}

