import {Project} from 'ts-morph'
import {genMsgNames, genSourceFile, genSourceFiles, genTestMessageFiles} from '../../util'
import {testing} from '../../../src/schema'

const {validateMessages, validateMessage} = testing
let project: Project
beforeEach(() => {
  project = new Project()
})

test('validateMessages() should not return an error when given a valid message', () => {
  const files = genSourceFiles(genTestMessageFiles(genMsgNames()), project)
  for (const file of files) {
    expect(validateMessages(file).length).toEqual(0)
  }
})

test('validateMessage() should not return an error when message has nested rpc.Msg literal', () => {
  const source  = `
  type MyMsg = rpc.Msg<{
    names: rpc.Msg<{
      people: rpc.Msg<{
        moreNames: $.list<rpc.Msg<{names: $.list<$.str>}>>
      }>
      }>
    }>`
  const type = genSourceFile(source, project).getTypeAlias('MyMsg')!
  expect(validateMessage(type).length).toEqual(0)
})

test('validateMessage() should return an error when message has non typerpc data type', () => {
  const source = `
  type TestMsg = rpc.Msg<{
    name: $.str
    numbers: number[]
    }>`
  const type = genSourceFile(source, project).getTypeAlias('TestMsg')!
  expect(validateMessage(type).length).toEqual(1)
})
