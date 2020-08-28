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
  isPrimitive,
  parseMsgProps,
} = testing

test('isValidDataType() should return the correct boolean value', () => {
  const props = parseMsgProps(genSourceFile(isValidDataTypeTestSource, project).getTypeAlias('SomeSvc')!)
  const types = props.map(prop => prop.getParentOrThrow())
  let i = 0
  while (i < types.length) {
    const expected = i % 2 !== 0
    expect(isValidDataType(types[i])).toBe(expected)
    i++
  }
})
