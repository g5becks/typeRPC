import {Project} from 'ts-morph'
import {testing} from '../../../src/schema'
import {genSourceFile, isValidDataTypeTestSource} from '../util'

let project: Project
beforeEach(() => {
  project = new Project()
}
)

const {
  isValidMsg,
  isValidDataType,
  isScalar,
  parseMsgProps,
} = testing

test('isValidDataType() should return the correct boolean value', () => {
  const props = parseMsgProps(genSourceFile(isValidDataTypeTestSource, project).getTypeAlias('SomeSvc')!)
  const types = props.map(prop => prop.getTypeNodeOrThrow())
  let i = 0
  while (i < types.length) {
    const expected = i % 2 !== 0
    expect(isValidDataType(types[i])).toBe(expected)
    i++
  }
})

test('isValidMsg() should return false when rpc.Msg type is not imported or true otherwise', () => {
  const source = `
  import {Name} from './util'

  type SomeType = rpc.Msg<{
    name: Name
  }>

  type SomeType2 = rpc.Msg<{
    name: Kid
  }>
  `
  const types = genSourceFile(source, project).getTypeAliases()
  const msg1 = parseMsgProps(types[0])[0].getTypeNodeOrThrow()
  const msg2 = parseMsgProps(types[1])[0].getTypeNodeOrThrow()
  expect(isValidMsg(msg1)).toBeTruthy()
  expect(isValidMsg(msg2)).toBeFalsy()
})

test('isScalar() should return true when given a scalar type false otherwise', () => {
  const source = `
  type SomeType = rpc.Msg<{
    names: $.List<$.int8>
    ages: $.int8
    other: $.Dict<$.int8, $.bool>
    smooth: $.str
    }>`
  const type = genSourceFile(source, project).getTypeAliasOrThrow('SomeType')
  const props = parseMsgProps(type)
  expect(isScalar(props[0].getTypeNodeOrThrow())).toBeFalsy()
  expect(isScalar(props[1].getTypeNodeOrThrow())).toBeTruthy()
  expect(isScalar(props[2].getTypeNodeOrThrow())).toBeFalsy()
  expect(isScalar(props[3].getTypeNodeOrThrow())).toBeTruthy()
})
