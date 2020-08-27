import {internalTesting, scalars, containers} from '../../../src/schema'
import {Project} from 'ts-morph'
import {getSourceFile, makeTestFile} from '../util'

const {
  isType,
  useCbor,
  makeDataType,
} = internalTesting

let project: Project
beforeEach(() => {
  project = new Project()
})

test('isType() should return true when given the proper type', () => {
  let vars = ''
  const types = [...scalars, ...containers]
  for (const type of scalars) {
    vars = vars.concat(`var ${type.replace('$.', '')}: ${type}\n`)
  }
  for (const type of containers) {
    vars = vars.concat(`var ${type.replace('$.', '')}: ${type}\n`)
  }
  getSourceFile(vars, project).getVariableDeclarations().forEach((variable, i) =>
    expect(isType(variable.getTypeNode()!, types[i])).toBeTruthy())
})

test('makeDataType() should return correct DataType for type prop', () => {
  const file = mak
  const types = file.getTypeAliases()
  for (const type of types) {
    const propType = getTypeNode(node)
    const dataType = makeDataType(propType)
    expect(dataType.toString()).toEqual(propType.getText().trim())
  }
})
