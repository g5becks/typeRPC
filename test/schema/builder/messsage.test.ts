import {testing} from '../../../src/schema'
import {exportTestMessages, genMsgNames, genSourceFile, genSourceFiles, genTestMessageFiles} from '../util'
import {Project, SourceFile} from 'ts-morph'
import {parseMsgProps} from '../../../src/schema/parser'

const {buildMessages} = testing

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

test('buildMessages() should return correct isExported value for exported types', () => {
  const file = genSourceFile(exportTestMessages, project)
  const messages = buildMessages(file)
  expect(messages[0].isExported).toBeTruthy()
  expect(messages[1].isExported).toBeFalsy()
})
