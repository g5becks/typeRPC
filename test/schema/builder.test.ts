import {internalTesting, isOptional} from '../../src/schema/builder'
import {Project} from 'ts-morph'
import {containersList, primitivesMap} from '../../src/schema/types'
// @ts-ignore
import {getSourceFile, makeRandomType, randomNumber, testController} from './util'

const {
  isType,
  isCbor,
  buildSchema,
  buildInterface,
  buildInterfaces,
  buildMethod,
  buildMethods,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  makeDataType,
} = internalTesting

let project: Project
beforeEach(() => {
  project = new Project()
})

test('isType() should return true when given the proper type', () => {
  let vars = ''
  const types = [...primitivesMap.keys(), ...containersList]
  for (const type of primitivesMap.keys()) {
    vars = vars.concat(`var ${type.replace('t.', '')}: ${type}\n`)
  }
  for (const type of containersList) {
    vars = vars.concat(`var ${type.replace('t.', '')}: ${type}\n`)
  }
  getSourceFile(vars, project).getVariableDeclarations().forEach((variable, i) =>
    expect(isType(variable.getTypeNode()!, types[i])).toBeTruthy())
})

test('makeRandomType() should return type with correct number of props', () => {
  const propsLen = randomNumber(0, 100)
  const type = makeRandomType(propsLen)
  const file = getSourceFile(type, project)
  const alias = file.getTypeAliases()[0]
  const propsLength = alias.getTypeNode()!.forEachChildAsArray().length
  expect(propsLength).toEqual(propsLen)
})

test('makeDataType() should return correct DataType for type prop', () => {
  const type = makeRandomType(randomNumber(200, 400))
  const file = getSourceFile(type, project)
  const types = file.getTypeAliases()[0].getTypeNode()!.forEachChildAsArray()
  for (const type of types) {
    const propType = type.getChildAtIndex(2)
    const dataType = makeDataType(propType)
    console.log('created: ' + dataType.toString() + ' actual: ' + propType.getText().trim())
    expect(dataType.toString()).toEqual(propType.getText().trim())
  }
})

test('isCbor() should return true when jsDoc contains cbor string', () => {
  const source = `
/**
* cbor
*/
type BinaryType = {
  data: t.blob
}
`
  expect(isCbor(getSourceFile(source, project).getTypeAliases()[0])).toBeTruthy()
})

test('isOptional() should return true when given optional prop', () => {
  const source = `
 type TypeWithOptional = {
    name?: string;
 }`
  const alias = getSourceFile(source, project).getTypeAliases()[0]
  const prop = alias.getTypeNode()!.forEachChildAsArray()[0]
  expect(isOptional(prop)).toBeTruthy()
})

test('buildHttpVerb() should return correct httpVerb', () => {
  const methods = getSourceFile(testController, project).getInterfaces()[0].getMethods()
  for (const method of methods) {
    const verb = method.getJsDocs()[0].getDescription().trim()
    expect(buildHttpVerb(method)).toEqual(verb)
  }
})
