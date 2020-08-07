import {
  InterfaceDeclaration,
  MethodSignature,
  ParameterDeclaration,
  Project,
  SourceFile,
  ts,
  Type,
  Node,
  TypeNode,
} from 'ts-morph'
import {make, primitives, DataType} from './schema/types'
import {Container, t} from '@typerpc/types'

const PrimitiveMap = new Map<string, Container>(
  Object.entries(primitives).map(([k, v]) => [v.toString(), v])
)
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

const hasReturn = (method: MethodSignature): boolean =>
  !['void', 'Promise<void>', '', 'undefined'].some(invalid => invalid === method.getReturnTypeNode()?.getText().trim())

export const hasJsDoc = (method: MethodSignature): boolean => {
  return method.getJsDocs().length > 0
}

const containersList = ['t.Dict', 't.Tuple2', 't.Tuple3', 't.Tuple4', 't.Tuple5', 't.List']

const isPrimitive = (text: string): boolean => PrimitiveMap.has(text)
const isContainer = (text: string): text is Container => containersList.some(type => text.startsWith(type))

const isList = (type: TypeNode<ts.TypeNode>): boolean => type.getChildAtIndex(0).getText().trim() === 't.List'

const makeList = (type: TypeNode<ts.TypeNode>): t.List => make
.List(makeElemType(type.getChildAtIndex(2)))

const makeContainer = (type: TypeNode<ts.TypeNode>): t.Container => {
  if (isList(type)) {
    return makeList(type)
  }
}

const makeElemType = (type: TypeNode<ts.TypeNode>| Node<ts.Node>): DataType => {

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
    if (isPrimitive(returnText)) {
      return PrimitiveMap.get(returnText)
    }
    if (!isContainer(returnText)) {
      return make.Struct(returnText)
    }
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
