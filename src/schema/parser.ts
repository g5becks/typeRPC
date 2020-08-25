import {
  MethodSignature,
  Node,
  PropertySignature,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeNode,
  TypeReferenceNode,
} from 'ts-morph'
import {isMsgLiteral} from './validator/utils'

const isTypeAlias = (type: any): type is TypeAliasDeclaration => 'getName' in type
const isTypeNode = (type: any): type is TypeNode => !('getName' in type)

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
