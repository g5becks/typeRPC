import {
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertySignature,
  SourceFile,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph'
import {containers} from '../types/data-type'
import {make} from '../types/make'

// is the type found is a typerpc primitive type?
export const isPrimitive = (type: TypeNode | Node): boolean => Boolean(make.primitive(type))

// is the type found a typerpc container type?
export const isContainer = (type: TypeNode | Node): boolean => containers.some(container => type.getText().trim().startsWith(container))

// is the type alias or node an rpc.Msg?
export const isMsg = (type: TypeAliasDeclaration | PropertySignature | ParameterDeclaration): boolean =>
  Boolean(type.getTypeNode()?.getText().startsWith('rpc.Msg<{'))

const getTypeNodeText = (type: TypeAliasDeclaration): string|undefined => type.getTypeNode()?.getText()

// is the type alias an rpc.QuerySvc?
export const isQuerySvc = (type: TypeAliasDeclaration): boolean => Boolean(getTypeNodeText(type)?.startsWith('rpc.QuerySvc<{'))

// is the type alias an rpc.MutationSvc
export const isMutationSvc = (type: TypeAliasDeclaration): boolean => Boolean(getTypeNodeText(type)?.startsWith('rpc.MutationSvc<{'))

// is the type alias an rpc.Msg defined in this schema file?
export const isValidMsg = (type: TypeNode | Node, projectFiles: SourceFile[]): boolean => projectFiles.flatMap(file => file.getTypeAliases()).flatMap(alias => isMsg(alias) && alias.getNameNode().getText().trim()).includes(type.getText().trim())

// A ts-morph declaration found in a schema file that has a getName() method
// E.G. FunctionDeclaration, VariableDeclaration
interface GetNameViolator {
  getName(): string | undefined;

  getStartLineNumber(includeJsDocComments?: boolean): number;

  getKindName(): string;

  getSourceFile(): SourceFile;
}

const canGetName = (type: Violator): type is GetNameViolator => 'getName' in type
// A ts-morph declaration found in a schema that does not have a getName() method
// but does have a getText() method

interface GetTextViolator {
  getText(includeJsDocComments?: boolean): string;

  getStartLineNumber(includeJsDocComments?: boolean): number;

  getKindName(): string;

  getSourceFile(): SourceFile;
}

// Anything that is not a type alias is a violator
export type Violator = GetNameViolator | GetTextViolator

// Returns an error about number of schema violation
export const multiValidationErr = (violators: Violator[]): Error =>
  new Error(`${violators[0].getSourceFile().getFilePath()?.toString()} contains ${violators.length} ${violators[0].getKindName()} declarations
   errors: ${violators.map(vio => canGetName(vio) ? vio.getName()?.trim() : vio.getText().trim() + ', at line number: ' + String(vio?.getStartLineNumber()) + '\n')}
   message: typerpc schemas can only contain a single import statement (import {t} from '@typerpc/types'), typeAlias (message), and interface (service) declarations.`)

// Returns a single schema violation error
export const singleValidationErr = (node: Node | undefined, msg: string): Error => {
  return new Error(
    `error in file: ${node?.getSourceFile()?.getFilePath()}
     at line number: ${node?.getStartLineNumber()}
     message: ${msg}`)
}

// error message for generic messages
const genericsErrMsg = (type: TypeAliasDeclaration | MethodSignature) => `${type.getName().trim()} defines a generic type . typerpc types and methods cannot be generic`

// validates that a type alias or method is not generic
export const validateNotGeneric = (type: TypeAliasDeclaration | MethodSignature): Error[] => {
  return type.getTypeParameters().length > 0 ? [singleValidationErr(type, genericsErrMsg(type))] : []
}

// is the node an rpc.Msg literal?
export const isMsgLiteral = (type: TypeNode| Node): boolean => type.getText().trim().startsWith('rpc.Msg<{')

// is the node a valid typerpc data type?
export const isValidDataType = (type: TypeNode| Node | undefined, projectFiles: SourceFile[]): boolean => {
  if (typeof type === 'undefined') {
    return false
  }
  return isPrimitive(type) || isContainer(type) || isValidMsg(type, projectFiles) || isMsgLiteral(type)
}
