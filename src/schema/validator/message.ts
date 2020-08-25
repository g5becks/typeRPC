import {PropertySignature, SourceFile, TypeAliasDeclaration, TypeNode} from 'ts-morph'
import {isMsg, isMsgLiteral, isValidDataType, singleValidationErr} from './utils'
import {parseMsgProps} from '../parser'

const validateProp = (prop: PropertySignature): Error[] =>
  isValidDataType(prop.getTypeNode()) ? [] : [singleValidationErr(prop, 'Invalid property type, Only types imported from @typerpc/types, rpc.Msg types, and other rpc.Msg types declared in the same file may be used as property types')]

// TODO test this
const validateMsgProps = (props: PropertySignature[]): Error[] => {
  let errs: Error[] = []
  for (const prop of props) {
    const type = prop.getTypeNode()
    // if the property is a message literal, call validateMsgProps
    // recursively
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
