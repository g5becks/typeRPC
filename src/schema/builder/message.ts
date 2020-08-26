// builds all properties of an rpc.Msg
import {PropertySignature, SourceFile} from 'ts-morph'
import {Message, Property} from '../schema'
import {isOptionalProp, parseMessages, parseMsgProps} from '../parser'
import {makeDataType} from './data-type'

export const buildProps = (properties: PropertySignature[], projectFiles: SourceFile[]): Property[] =>
  properties.map(prop => {
    return {
      isOptional: isOptionalProp(prop),
      type: makeDataType(prop.getTypeNodeOrThrow(), projectFiles),
      name: prop.getName().trim(),
    }
  })

// Converts all rpc.Msg types in files into Schema Messages
export const buildMessages = (file: SourceFile, projectFiles: SourceFile[]): Message[] => {
  const messages = parseMessages(file)
  if (messages.length === 0) {
    return []
  }

  return [...new Set(messages.map(msg => {
    return {
      isExported: msg.isExported(),
      name: msg.getNameNode().getText().trim(),
      properties: [...new Set(buildProps(parseMsgProps(msg), projectFiles))],
    }
  }))]
}
