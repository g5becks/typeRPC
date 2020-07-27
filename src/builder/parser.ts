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
}

export const hasParams = (method: MethodSignature): boolean => method.getParameters().length > 0

export const hasReturn = (method: MethodSignature): boolean => {
  const nonValids = ['void', 'Promise<void>', '', 'undefined']
  // noinspection TypeScriptValidateTypes
  const returnType = method.getReturnTypeNode()?.getText().trim()
  if (typeof returnType !== 'undefined') {
    return !nonValids.includes(returnType)
  }
  return false
}

export const getParamName = (param: ParameterDeclaration): string => param.getText().trim()

export const getParamType = (param: ParameterDeclaration): string => {
  const maybeParamType = param.getTypeNode()
  let paramType = 'any'
  if (typeof maybeParamType !== 'undefined') {
    paramType = maybeParamType.getText().trim()
  }
  return paramType
}

export const getReturnType = (method: MethodSignature): string => {
  const maybeReturnType = method.getReturnTypeNode()
  let returnType = 'void'
  if (typeof maybeReturnType !== 'undefined') {
    returnType = maybeReturnType.getText().trim()
  }
  return returnType
}

export const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

export const getInterfaceName = (service: InterfaceDeclaration): string => service.getNameNode().getText().trim()

export const getMethodsForInterface = (interfce: InterfaceDeclaration): MethodSignature[] => interfce.getMethods()

export const getInterfaces = (file: SourceFile): InterfaceDeclaration[] => file.getInterfaces()

export const getMethodsForFile = (file: SourceFile): MethodSignature[] => {
  const interfaces = getInterfaces(file)
  const methods: MethodSignature[] = []
  for (const interfc of interfaces) {
    methods.push(...getMethodsForInterface(interfc))
  }
  return methods
}

export const getParams = (method: MethodSignature): ParameterDeclaration[] => method.getParameters()

export const getTypeAliasesText = (file: SourceFile): string[] => file.getTypeAliases().map(alias => alias.getNameNode().getText())

export const getInterfacesText = (file: SourceFile): string[] => file.getInterfaces().map(srvc => srvc.getNameNode().getText())
