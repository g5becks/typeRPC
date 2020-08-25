import {
  MethodSignature,
  Node,
  PropertySignature,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeNode,
  TypeReferenceNode,
} from 'ts-morph'
import {isMsg, isMsgLiteral, isService} from './validator'

const isTypeAlias = (type: any): type is TypeAliasDeclaration => 'getName' in type
const isTypeNode = (type: any): type is TypeNode => !('getName' in type)

// is the type property optional?
export const isOptionalProp = (prop: PropertySignature): boolean => typeof prop.getQuestionTokenNode() !== 'undefined'

// parse all of the properties from an rpc.Msg Type alias for rpc.Msg literal
export const parseMsgProps = (type: TypeAliasDeclaration | TypeNode | Node): PropertySignature[] => {
  let kids: PropertySignature[] = []
  if (isTypeAlias(type)) {
    kids = type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.PropertySignature)
  }
  if (isTypeNode(type) && isMsgLiteral(type)) {
    kids = type.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.PropertySignature)
  }
  return kids
}

// returns the type parameters portion of the type as an array
export const parseTypeParams = (type: Node | TypeNode): TypeReferenceNode[] => type.getChildrenOfKind(SyntaxKind.TypeReference)

// gets the comment portion of a JsDoc comment base on the tagName
export const parseJsDocComment = (method: MethodSignature | TypeAliasDeclaration, tagName: string): string | undefined => {
  const tags = method.getJsDocs()[0]?.getTags()
  return tags?.filter(tag => tag.getTagName() === tagName)[0]?.getComment()?.trim()
}

// parses all message declarations from a schema file
export const parseMessages = (file: SourceFile): TypeAliasDeclaration[] => file.getTypeAliases().filter(alias => isMsg(alias))

// parses all service declarations from a schema file
export const parseServices = (file: SourceFile): TypeAliasDeclaration[] =>
  file.getTypeAliases().filter(alias => isService(alias))

// parse all of the methods from an rpc.Service type alias
export const parseServiceMethods = (type: TypeAliasDeclaration): MethodSignature[] => type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.MethodSignature)
