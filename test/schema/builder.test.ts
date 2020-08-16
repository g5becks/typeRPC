import {getTypeNode, internalTesting, isOptional} from '../../src/schema/builder'
import {Project} from 'ts-morph'
import {containersList, primitivesMap} from '../../src/schema/types'

import {
  getSourceFile,
  makeRandomType,
  makeTestMethods,
  makeTestSchemasFiles,
  randomNumber,
  testController,
  testProp,
} from './util'

const {
  isType,
  isCbor,
  buildSchema,
  buildMethod,
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
    const propType = getTypeNode(type)
    const dataType = makeDataType(propType)
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

test('buildProps() should return correct type alias properties', () => {
  const propsLen = randomNumber(200, 400)
  const sourceType = makeRandomType(propsLen)
  const type = getSourceFile(sourceType, project).getTypeAliases()[0]
  const props = type.getTypeNode()!.forEachChildAsArray()
  const builtProps = buildProps(props)
  const testProps: testProp[] = props.map(prop => {
    return {isOptional: prop.getText().includes('?'), name: prop.getChildAtIndex(0).getText().trim(), type: getTypeNode(prop).getText().trim()}
  })
  for (let i = 0; i < builtProps.length; i++) {
    expect(builtProps[i].name).toEqual(testProps[i].name)
    expect(builtProps[i].isOptional).toEqual(testProps[i].isOptional)
    expect(builtProps[i].type.toString()).toEqual(testProps[i].type)
  }
})

test('buildTypes() should return correct Set of types', () => {
  const numTypes = randomNumber(50, 75)
  let types = ''
  for (let i = 0; i < numTypes; i++) {
    types += (`${makeRandomType(randomNumber(20, 40))}\n`)
  }
  const file = getSourceFile(types, project)
  const aliases = file.getTypeAliases()
  const builtTypes = buildTypes(file)
  expect(builtTypes.size).toEqual(numTypes)
  const builtArray = [...builtTypes]
  for (let i = 0; i < builtTypes.size; i++) {
    expect(builtArray[i].properties.size).toEqual(aliases[i].getTypeNode()!.forEachChildAsArray().length)
  }
})

test('buildParams() should return correct Params', () => {
  const methods = makeTestMethods(project)
  for (const method of methods) {
    const params = method.getParameters()
    const builtParams = buildParams(params)
    const builtParamsArray = [...builtParams]
    expect(params.length).toEqual(builtParams.size)
    for (let i = 0; i < params.length; i++) {
      expect(params[i].isOptional()).toEqual(builtParamsArray[i].isOptional)
      expect(params[i].getNameNode().getText().trim()).toEqual(builtParamsArray[i].name)
      expect(params[i].getTypeNode()!.getText().trim()).toEqual(builtParamsArray[i].type.toString())
    }
  }
})

test('buildMethod() should return method with correct params and return type', () => {
  const methods = makeTestMethods(project)
  for (const method of methods) {
    const builtMethod = buildMethod(method)
    expect(method.getReturnTypeNode()!.getText().trim()).toEqual(builtMethod.returnType.toString())
    expect(method.getNameNode().getText().trim()).toEqual(builtMethod.name)
    expect(method.getParameters().length).toEqual(builtMethod.params.size)
  }
})

test('buildSchema() should have correct name, num types, and num interfaces', () => {
  for (const source of makeTestSchemasFiles(project)) {
    const schema = buildSchema(source)
    expect(schema.fileName).toEqual(source.getBaseName())
    expect(schema.interfaces.size).toEqual(source.getInterfaces().length)
    expect(schema.types.size).toEqual(source.getTypeAliases().length)
  }
})
