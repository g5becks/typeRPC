import {_testing} from '../../../src/builders'
import {Project} from 'ts-morph'
import {testing} from '../../../src/schema'
import {dataTypeTestsSource, expectedTsDataTypes, genSourceFile} from '../../util'

const {dataType} = _testing
const {parseMsgProps, makeDataType} = testing
let project: Project

beforeEach(() => {
  project = new Project()
})

test('dataType() should produce the correct output', () => {
  const props = parseMsgProps(genSourceFile(dataTypeTestsSource, project).getTypeAliasOrThrow('TestType'))
  const  types = props.map(prop => makeDataType(prop.getTypeNodeOrThrow()))
  let i = 0
  while (i < types.length) {
    expect(dataType(types[i])).toEqual(expectedTsDataTypes[i])
    i++
  }
})
