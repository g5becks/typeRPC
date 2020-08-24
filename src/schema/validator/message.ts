// TODO test this
import {PropertySignature, SourceFile, SyntaxKind, TypeAliasDeclaration} from 'ts-morph'
import {isMsg, isValidDataType, isValidTypeAlias, singleValidationErr} from './utils'

const validateMsgProps = (props: PropertySignature[]): Error[] => {
  let errs: Error[] = []
  for (const prop of props) {
    // get the properties type
    const propType = prop.getTypeNode()
    if (typeof propType === 'undefined') {
      errs = errs.concat(singleValidationErr(propType, 'all properties must have a valid typerpc type'))
    } else if (!isValidDataType(prop) && !isValidTypeAlias(propType)) {
      errs.push(singleValidationErr(prop, 'Invalid property type, Only types imported from @typerpc/types, rpc.Msg types, and other rpc.Msg types declared in the same file may be used as property types'))
    }
  }

  return errs
}
// parses all message declarations from a schema file
const parseMessages = (file: SourceFile): TypeAliasDeclaration[] => file.getTypeAliases().filter(alias => isMsg(alias))
// parse all of the properties from an rpc.Msg type alias
export const parseMsgProps = (type: TypeAliasDeclaration): PropertySignature[] =>
  type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral)[0].getChildrenOfKind(SyntaxKind.PropertySignature)
