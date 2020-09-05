import {_testing} from '../../plugin/lib'
import {Project, PropertySignature} from 'ts-morph'
import {testing} from '../../../src/schema'
import {dataTypeTestsSource, expectedTsDataTypes, genSourceFile} from '../../test-utils/lib'

const {tsDataType, tsFromQueryString} = _testing
const {parseMsgProps, makeDataType} = testing
let project: Project
let props: PropertySignature[]
beforeAll(() => {
  project = new Project()
  props = parseMsgProps(genSourceFile(dataTypeTestsSource, project).getTypeAliasOrThrow('TestType'))
})

test('tsDataType() should produce the correct output', () => {
  const types = props.map(prop => makeDataType(prop.getTypeNodeOrThrow()))
  let i = 0
  while (i < types.length) {
    expect(tsDataType(types[i])).toEqual(expectedTsDataTypes[i])
    i++
  }
})

test('tsFromQueryString() should produce the correct output', () => {
  const propsMap: {[key: string]: string} = {
    bool: 'Boolean(bool)',
    int8: 'parseInt(int8)',
    uint8: 'parseInt(uint8)',
    int16: 'parseInt(int16)',
    uint16: 'parseInt(uint16)',
    int32: 'parseInt(int32)',
    uint32: 'parseInt(uint32)',
    int64: 'parseInt(int64)',
    uint64: 'parseInt(uint64)',
    float32: 'parseFloat(float32)',
    float64: 'parseFloat(float64)',
    list: 'list.map(val => Boolean(val))',
    queryParamList: 'queryParamList.map(val => parseInt(val))',
  }

  const filteredProps = props.filter(prop => Object.keys(propsMap).includes(prop.getName()))
  const types =  filteredProps.map(prop => makeDataType(prop.getTypeNodeOrThrow()))
  let i = 0
  while (i < types.length) {
    const name = filteredProps[i].getName()
    expect(tsFromQueryString(name, types[i])).toEqual(propsMap[name])
    i++
  }
})
