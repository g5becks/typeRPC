// builds all properties of an rpc.Msg
import { PropertySignature, SourceFile } from 'ts-morph'
import { Message, Property } from '../../schema/src/schema'
import { isOptionalProp, parseMessages, parseMsgProps } from '@typerpc/parser'
import { makeDataType } from './data-type'

const buildProps = (properties: PropertySignature[]): Property[] =>
    properties.map((prop) => {
        return {
            isOptional: isOptionalProp(prop),
            type: makeDataType(prop.getTypeNodeOrThrow()),
            name: prop.getName().trim(),
        }
    })

// Converts all rpc.Msg types in files into Schema Messages
export const buildMessages = (file: SourceFile): Message[] => {
    const messages = parseMessages(file)
    if (messages.length === 0) {
        return []
    }

    return [
        ...new Set(
            messages.map((msg) => {
                return {
                    name: msg.getNameNode().getText().trim(),
                    properties: [...new Set(buildProps(parseMsgProps(msg)))],
                }
            }),
        ),
    ]
}
