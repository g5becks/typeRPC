import {PropertySignature, SourceFile, SyntaxKind, TypeAliasDeclaration, TypeNode} from 'ts-morph'
import {isContainer, isMsg, isMsgLiteral, isPrimitive, isValidMsg, singleValidationErr} from './utils'

const isTypeAlias = (type: any): type is TypeAliasDeclaration => 'getName' in type

const isTypeNode = (type: any): type is TypeNode => !('getName' in type)

// parse all of the properties from an rpc.Msg Type alias for rpc.Msg literal
const parseMsgProps = (type: TypeAliasDeclaration | TypeNode): PropertySignature[] => {
  let kids: PropertySignature[] = []
  if (isTypeAlias(type)) {
    kids = type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.PropertySignature)
  }
  if (isTypeNode(type) && isMsgLiteral(type)) {
    kids = type.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.PropertySignature)
  }
  return kids
}

const validateProp = (prop: PropertySignature): Error[] => {
  const node = prop.getTypeNode()
  if (typeof node === 'undefined') {
    return [singleValidationErr(prop, 'all properties must have a valid data type')]
  }
  return isMsgLiteral(node) || isValidMsg(node) || isPrimitive(node) || isContainer(node.getText().trim()) ? [] : [singleValidationErr(prop, 'Invalid property type, Only types imported from @typerpc/types, rpc.Msg types, and other rpc.Msg types declared in the same file may be used as property types')]
}

// TODO test this
const validateMsgProps = (props: PropertySignature[]): Error[] => {
  let errs: Error[] = []
  for (const prop of props) {
    const type = prop.getTypeNode()
    if (typeof type !== 'undefined' && isMsgLiteral(type)) {
      errs =  errs.concat(validateMsgProps(parseMsgProps(type)))
    }
    errs = errs.concat(validateProp(prop))
  }
  return errs
}
// parses all message declarations from a schema file
const parseMessages = (file: SourceFile): TypeAliasDeclaration[] => file.getTypeAliases().filter(alias => isMsg(alias))

export const validateMessage = (msg: TypeAliasDeclaration| TypeNode): Error[] =>
  validateMsgProps(parseMsgProps(msg))

export const validateMessages = (file: SourceFile): Error[] =>
  parseMessages(file).flatMap(msg => validateMessage(msg))
