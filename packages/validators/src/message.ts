import { PropertySignature, SourceFile, TypeAliasDeclaration, TypeNode } from 'ts-morph'
import { isMsgLiteral, isValidDataType, singleValidationErr } from './utils'
import { parseMessages, parseMsgProps } from '../../parser/src/parser'

const validateProp = (prop: PropertySignature): Error[] =>
    isValidDataType(prop.getTypeNode())
        ? []
        : [
              singleValidationErr(
                  prop,
                  'Invalid property type, Only messages imported from @typerpc/messages, rpc.Msg messages, and other rpc.Msg messages declared in the same file may be used as property messages',
              ),
          ]

const validateMsgProps = (props: PropertySignature[]): Error[] => {
    let errs: Error[] = []
    for (const prop of props) {
        const type = prop.getTypeNode()
        // if the property is a message literal, call validateMsgProps
        // recursively
        if (typeof type !== 'undefined' && isMsgLiteral(type)) {
            errs = errs.concat(validateMsgProps(parseMsgProps(type)))
        }
        errs = errs.concat(validateProp(prop))
    }
    return errs
}

export const validateMessage = (msg: TypeAliasDeclaration | TypeNode): Error[] => {
    if (parseMsgProps(msg).length === 0) {
        return [singleValidationErr(msg, 'Message has no properties. Empty messages are not allowed.')]
    }
    return validateMsgProps(parseMsgProps(msg))
}

export const validateMessages = (file: SourceFile): Error[] =>
    parseMessages(file).flatMap((msg) => validateMessage(msg))
