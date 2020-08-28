import {testing} from '../../../src/schema'
import {exportTestMessages, genMsgNames, genSourceFile, genSourceFiles, genTestMessageFiles} from '../util'
import {Project, SourceFile} from 'ts-morph'

const {buildMessages, parseMsgProps, isOptionalProp} = testing

let project: Project
let files: SourceFile[]
beforeEach(() => {
  project = new Project()
  files = genSourceFiles(genTestMessageFiles(genMsgNames()), project)
})

test('buildMessages() should return all messages with correct name', () => {
  for (const file of files) {
    const messages = buildMessages(file)
    for (const message of messages) {
      expect(file.getTypeAlias(message.name)).toBeTruthy()
    }
  }
})

test('buildMessages() should return all messages with correct number of properties', () => {
  for (const file of files) {
    const messages = buildMessages(file)
    for (const message of messages) {
      expect(parseMsgProps(file.getTypeAlias(message.name)!).length).toEqual(message.properties.length)
    }
  }
})

test('buildMessages() should return messages with correct isExported value for exported types', () => {
  const file = genSourceFile(exportTestMessages, project)
  const messages = buildMessages(file)
  expect(messages[0].isExported).toBeTruthy()
  expect(messages[1].isExported).toBeFalsy()
})

test('buildMessages() should return messages with correct isOptional value for all properties', () => {
  for (const file of files) {
    const messages = buildMessages(file)
    for (const message of messages) {
      const props = parseMsgProps(file.getTypeAlias(message.name)!)
      let i = 0
      while (i < message.properties.length) {
        expect(isOptionalProp(props[i])).toEqual(message.properties[i].isOptional)
        i++
      }
    }
  }
})
