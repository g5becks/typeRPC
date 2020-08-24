import {containersList, primitivesMap} from '../types'
import {
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertySignature,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph'
import {HTTPVerb} from '../schema'

// is the type found is a typerpc primitive type?
export const isPrimitive = (typeText: string): boolean => primitivesMap.has(typeText.trim())
// is the type found a typerpc container type?
export const isContainer = (typeText: string): boolean => containersList.some(container => typeText.trim().startsWith(container))
// is the type found a valid typerpc type?
export const isValidDataType = (type: TypeAliasDeclaration | PropertySignature | ParameterDeclaration): boolean =>
  isPrimitive(type.getTypeNode()!.getText().trim()) || isMsg(type) || isContainer(type.getTypeNode()!.getText().trim())
// is the type alias or node an rpc.Msg?
export const isMsg = (type: TypeAliasDeclaration | PropertySignature | ParameterDeclaration): boolean =>
  Boolean(type.getTypeNode()?.getText().startsWith('rpc.Msg<{'))
// is the type alias an rpc.Service?
export const isService = (type: TypeAliasDeclaration): boolean => Boolean(type.getTypeNode()?.getText().startsWith('rpc.Service<{'))
// is the type alias used as a property or parameter a type alias defined in this
// schema file?
export const isValidTypeAlias = (type: TypeNode | Node): boolean => type.getSourceFile().getTypeAliases().map(alias => isMsg(alias) && alias.getNameNode().getText().trim()).includes(type.getText().trim())

// is the http verb used in the JsDoc @access tag a valid typerpc HTTPVerb?
export const isHttpVerb = (method: string | undefined): method is HTTPVerb =>
  ['POST', 'GET'].includes(method ?? '')
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
// Returns a detailed error message about number of schema violations
export const multiValidationErr = (violators: Violator[]): Error =>
  new Error(`${violators[0].getSourceFile().getFilePath()?.toString()} contains ${violators.length} ${violators[0].getKindName()} declarations
   errors: ${violators.map(vio => canGetName(vio) ? vio.getName()?.trim() : vio.getText().trim() + ', at line number: ' + String(vio?.getStartLineNumber()) + '\n')}
   message: typerpc schemas can only contain a single import statement (import {t} from '@typerpc/types'), typeAlias (message), and interface (service) declarations.`)
// Returns an error about a single schema violation
export const singleValidationErr = (node: Node | undefined, msg: string): Error => {
  return new Error(
    `error in file: ${node?.getSourceFile()?.getFilePath()}
     at line number: ${node?.getStartLineNumber()}
     message: ${msg}`)
}
const genericsErrMsg = (type: TypeAliasDeclaration | MethodSignature) => `${type.getName().trim()} defines a generic type . typerpc types and methods cannot be generic`
export const validateNotGeneric = (type: TypeAliasDeclaration | MethodSignature): Error[] => {
  return type.getTypeParameters().length > 0 ? [singleValidationErr(type, genericsErrMsg(type))] : []
}
// Runs a pre-validation step on all type aliases found in a schema file
// to ensure they are eligible to move forward into the next validation stage.
// This check ensures the type is either an rpc.Service or rpc.Msg,
// that the type has a typeNode, and that the typeNode is a TypeLiteral
export const preValidateType = (type: TypeAliasDeclaration): Error[] => {
  if (typeof type.getTypeNode() === 'undefined') {
    return [new Error()]
  }
  if (type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral).length !== 1) {
    return [singleValidationErr(type,
      `All typerpc messages and services must be Type Literals, E.G.
      type  Mytype = {
      (properties with valid type rpc data types or other rpc.Msg types)
      },
      Typescript types (number, string[]), intersections, and unions are not supported.`)]
  }
  if (!isMsg(type) || isService(type)) {
    return [singleValidationErr(type, `typerpc schema files cannot contain type
	  aliases that are not either rpc.Msg, or rpc.Service definitions.`)]
  }
  return []
}
