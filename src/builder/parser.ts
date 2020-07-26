import {InterfaceDeclaration, MethodSignature, ParameterDeclaration, Project, SourceFile} from 'ts-morph'
/**
 * Parses specified project source code files
 *
 * @export
 * @class Parser
 */
export class Parser {
  public readonly project: Project

  public get sourceFiles() {
    return this.project.getSourceFiles()
  }

  constructor(private readonly tsConfigFilePath: string) {
    this.project = new Project({tsConfigFilePath: tsConfigFilePath, skipFileDependencyResolution: true})
  }

  static hasParams(method: MethodSignature): boolean {
    return method.getParameters().length > 0
  }

  static hasReturn(method: MethodSignature): boolean {
    const nonValids = ['void', 'Promise<void>', '', 'undefined']
    // noinspection TypeScriptValidateTypes
    const returnType = method.getReturnTypeNode()?.getText().trim()
    if (typeof returnType !== 'undefined') {
      return !nonValids.includes(returnType)
    }
    return false
  }

  static getMethodsForInterface(interfce: InterfaceDeclaration): MethodSignature[] {
    return interfce.getMethods()
  }

  static getMethodsForFile(file: SourceFile): MethodSignature[] {
    const interfaces = Parser.getInterfaces(file)
    const methods: MethodSignature[] = []
    for (const interfc of interfaces) {
      methods.push(...Parser.getMethodsForInterface(interfc))
    }
    return methods
  }

  static getParams(method: MethodSignature): ParameterDeclaration[] {
    return method.getParameters()
  }

  static getInterfaces(file: SourceFile): InterfaceDeclaration[] {
    return file.getInterfaces()
  }

  static getTypeAliasesText(file: SourceFile): string[] {
    return file.getTypeAliases().map(alias => alias.getNameNode().getText())
  }

  static getInterfacesText(file: SourceFile): string[] {
    return file.getInterfaces().map(srvc => srvc.getNameNode().getText())
  }
}

