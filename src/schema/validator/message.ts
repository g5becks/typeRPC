import {PropertySignature, SourceFile, TypeAliasDeclaration, TypeNode} from 'ts-morph'
import {isMsgLiteral, isValidDataType, singleValidationErr} from './utils'
import {parseMessages, parseMsgProps} from '../parser'

const validateProp = (prop: PropertySignature, projectFiles: SourceFile[]): Error[] =>
  isValidDataType(prop.getTypeNode(), projectFiles) ? [] : [singleValidationErr(prop, 'Invalid property type, Only messages imported from @typerpc/messages, rpc.Msg messages, and other rpc.Msg messages declared in the same file may be used as property messages')]

// TODO test this
const validateMsgProps = (props: PropertySignature[], projectFiles: SourceFile[]): Error[] => {
  let errs: Error[] = []
  for (const prop of props) {
    const type = prop.getTypeNode()
    // if the property is a message literal, call validateMsgProps
    // recursively
    if (typeof type !== 'undefined' && isMsgLiteral(type)) {
      errs =  errs.concat(validateMsgProps(parseMsgProps(type), projectFiles))
    }
    errs = errs.concat(validateProp(prop, projectFiles))
  }
  return errs
}

export const validateMessage = (msg: TypeAliasDeclaration| TypeNode, projectFiles: SourceFile[]): Error[] =>
  validateMsgProps(parseMsgProps(msg), projectFiles)

export const validateMessages = (file: SourceFile, projectFiles: SourceFile[]): Error[] =>
  parseMessages(file).flatMap(msg => validateMessage(msg, projectFiles))
