import {
  InterfaceDeclaration,
  MethodSignature,
  ParameterDeclaration,
  Project,
  SourceFile,
  TypeAliasDeclaration,
} from 'ts-morph'
import {DataType, primitives} from './schema/types'



export const hasParams = (method: MethodSignature): boolean => method.getParameters().length > 0

const hasReturn = (method: MethodSignature): boolean =>
  !['void', 'Promise<void>', '', 'undefined'].some(invalid => invalid === method.getReturnTypeNode()?.getText().trim())

export const hasJsDoc = (method: MethodSignature): boolean => {
  return method.getJsDocs().length > 0
}

export const getReturnType = (method: MethodSignature): DataType => {
  if (!hasReturn(method)) {
    return primitives.unit
  }
  const param = method.getParameters()
  const maybeReturnType = method.getReturnTypeNode()
  let returnText = ''
  if (typeof maybeReturnType !== 'undefined') {
    returnText = maybeReturnType.getText().trim()
  }
}

export const isVoidReturn = (method: MethodSignature): boolean => {
  return getReturnType(method) === 'void'
}

export const getParamName = (param: ParameterDeclaration): string => param.getNameNode().getText().trim()

export const getParamWithType = (param: ParameterDeclaration): string => param.getText().trim()

export const getParamType = (param: ParameterDeclaration): string => {
  const maybeParamType = param.getTypeNode()
  let paramType = 'any'
  if (typeof maybeParamType !== 'undefined') {
    paramType = maybeParamType.getText().trim()
  }
  // eslint-disable-next-line no-console
  console.log(paramType)
  return paramType
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
