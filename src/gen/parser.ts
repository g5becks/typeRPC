import {InterfaceDeclaration, MethodSignature, ParameterDeclaration, Project, SourceFile, ts, Type} from 'ts-morph'
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

  // determines if the interface extends RpcService interface
  isRpcService(service: InterfaceDeclaration): boolean {
    return service.getExtends().some(clause => clause.getText().trim() === 'RpcService')
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

  getMethodReturnType(method: MethodSignature): Type<ts.Type> {
    return method.getReturnType()
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

  getAllReturnTypes(file: SourceFile): Type<ts.Type>[] {
    return this.getMethodsForFile(file).map(method => this.getMethodReturnType(method))
  }
}

