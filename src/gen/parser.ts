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

  hasParams(method: MethodSignature): boolean {
    return method.getParameters().length > 0
  }

  hasReturn(method: MethodSignature): boolean {
    const nonValids = ['void', 'Promise<void>', '', 'undefined']
    const returnType = method.getReturnTypeNode()?.getText().trim()
    if (typeof returnType !== 'undefined') {
      return !nonValids.includes(returnType)
    }
    return false
  }

  getMethodsForInterface(interfce: InterfaceDeclaration): MethodSignature[] {
    return interfce.getMethods()
  }

  getMethodsForFile(file: SourceFile): MethodSignature[] {
    const interfaces = this.getInterfaces(file)
    const methods: MethodSignature[] = []
    interfaces.forEach(interfc =>
      methods.push(...this.getMethodsForInterface(interfc))
    )
    return methods
  }

  getParams(method: MethodSignature): ParameterDeclaration[] {
    return method.getParameters()
  }

  getInterfaces(file: SourceFile): InterfaceDeclaration[] {
    return file.getInterfaces()
  }

  getTypeAliasesText(file: SourceFile): string[] {
    return file.getTypeAliases().map(alias => alias.getNameNode().getText())
  }

  getInterfacesText(file: SourceFile): string[] {
    return file.getInterfaces().map(srvc => srvc.getNameNode().getText())
  }
}

