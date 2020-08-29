/* eslint-disable new-cap */
import {Node, Project, TypeNode} from 'ts-morph'
import {is, make, testing} from '../../../src/schema'
import {genSourceFile, typesTestData} from '../util'

const types: {[key: string]: Node| TypeNode} = {}
const {makeDataType} = testing
beforeAll(() => {
  const {parseMsgProps} = testing
  const file = genSourceFile(typesTestData, new Project())
  const type = file.getTypeAliasOrThrow('TestType')
  const props = parseMsgProps(type)
  props.forEach(prop => {
    types[prop.getName()] = prop.getTypeNodeOrThrow()
  })
})

test('is.Dict() should return true when given valid $.Dict, false otherwise', () => {
  expect(is.Dict(make.Dict(types.dict, makeDataType))).toBeTruthy()
  expect(is.Dict(make.Tuple(types.tuple2, makeDataType))).toBeFalsy()
})

