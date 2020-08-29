/* eslint-disable new-cap */
import {genSourceFile, typesTestData} from '../util'
import {make, testing} from '../../../src/schema'
import {Node, Project, TypeNode} from 'ts-morph'

export const made: {[key: string]: Node| TypeNode} = {}

export const {makeDataType} = testing

beforeAll(() => {
  const {parseMsgProps} = testing
  const file = genSourceFile(typesTestData, new Project())
  const type = file.getTypeAliasOrThrow('TestType')
  const props = parseMsgProps(type)
  props.forEach(prop => {
    made[prop.getName()] = prop.getTypeNodeOrThrow()
  })
})

test('make.Struct should return struct with correct name and useCbor values', () => {
  expect(make.Struct(made.struct).name).toEqual('SomeStruct')
  expect(make.Struct(made.cborType).useCbor).toBeTruthy()
})

