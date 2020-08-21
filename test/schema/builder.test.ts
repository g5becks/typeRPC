/* eslint-disable new-cap */
import {getTypeNode, internalTesting, isOptional} from '../../src/schema/builder'
import {Project} from 'ts-morph'
import {containersList, is, primitivesMap} from '../../src/schema/types'

import {getSourceFile, makeStructTestSource, makeTestFile, makeTestFiles, testController, testProp} from './util'

const {
  isType,
  useCbor,
  buildSchema,
  buildMethod,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  buildErrCode,
  buildResponseCode,
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

test('makeDataType() should return correct DataType for type prop', () => {
  const file = makeTestFile(project)
  const types = file.getTypeAliases()
  for (const type of types) {
    for (const node of type.getTypeNode()!.forEachChildAsArray()) {
      const propType = getTypeNode(node)
      const dataType = makeDataType(propType)
      expect(dataType.toString()).toEqual(propType.getText().trim())
    }
  }
})

test('useCbor() should return true when jsDoc contains cbor string', () => {
  const source = `
/** @kind cbor */
type BinaryType = {
  data: t.blob
}
`
  expect(useCbor(getSourceFile(source, project).getTypeAliases()[0])).toBeTruthy()
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

test('buildHttpVerb() should return correct HttpVerb', () => {
  const methods = getSourceFile(testController, project).getInterfaces()[0].getMethods()
  for (let i = 0; i < methods.length; i++) {
    const verb = buildHttpVerb(methods[i])
    switch (i) {
    case 0:
      expect(verb).toEqual('GET')
      break
    case 1:
      expect(verb).toEqual('POST')
      break
    case 2:
      expect(verb).toEqual('POST')
      break
    case 3:
      expect(verb).toEqual('POST')
      break
    case 4:
      expect(verb).toEqual('POST')
      break
    case 5:
      expect(verb).toEqual('POST')
      break
    case 6:
      expect(verb).toEqual('POST')
      break
    }
  }
})

test('buildErrCode() should return correct HttpErrorCode', () => {
  const methods = getSourceFile(testController, project).getInterfaces()[0].getMethods()

  for (let i = 0; i < methods.length; i++) {
    const errCode = buildErrCode(methods[i])
    switch (i) {
    case 0:
      expect(errCode).toEqual(404)
      break
    case 1:
      expect(errCode).toEqual(500)
      break
    case 2:
      expect(errCode).toEqual(401)
      break
    case 3:
      expect(errCode).toEqual(400)
      break
    case 4:
      expect(errCode).toEqual(403)
      break
    default:
      expect(errCode).toEqual(500)
    }
  }
})

test('buildResponseCode() should return correct HttpResponse', () => {
  const methods = getSourceFile(testController, project).getInterfaces()[0].getMethods()
  for (let i = 0; i < methods.length; i++) {
    const responseCode = buildResponseCode(methods[i])
    switch (i) {
    case 0:
      expect(responseCode).toEqual(200)
      break
    case 1:
      expect(responseCode).toEqual(202)
      break
    case 2:
      expect(responseCode).toEqual(201)
      break
    case 3:
      expect(responseCode).toEqual(204)
      break
    case 4:
      expect(responseCode).toEqual(301)
      break
    default:
      expect(responseCode).toEqual(200)
    }
  }
})

test('buildProps() should return correct type alias properties', () => {
  const file = makeTestFile(project)
  const types = file.getTypeAliases()
  for (const type of types) {
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
  }
})

test('buildTypes() should return correct Set of types', () => {
  const file = makeTestFile(project)
  const aliases = file.getTypeAliases()
  const builtTypes = buildTypes(file)
  expect(builtTypes.length).toEqual(aliases.length)
  for (let i = 0; i < builtTypes.length; i++) {
    expect(builtTypes[i].properties.length).toEqual(aliases[i].getTypeNode()!.forEachChildAsArray().length)
  }
})

test('buildParams() should return correct Params', () => {
  const interfaces = makeTestFile(project).getInterfaces()
  const methods = interfaces.flatMap(interfc => interfc.getMethods())
  for (const method of methods) {
    const params = method.getParameters()
    const builtParams = buildParams(params)
    expect(params.length).toEqual(builtParams.length)
    for (let i = 0; i < params.length; i++) {
      expect(params[i].isOptional()).toEqual(builtParams[i].isOptional)
      expect(params[i].getNameNode().getText().trim()).toEqual(builtParams[i].name)
      expect(params[i].getTypeNode()!.getText().trim()).toEqual(builtParams[i].type.toString())
    }
  }
})

test('buildMethod() should return method with correct params and return type', () => {
  const interfaces = makeTestFile(project).getInterfaces()
  const methods = interfaces.flatMap(interfc => interfc.getMethods())
  for (const method of methods) {
    const builtMethod = buildMethod(method)
    expect(method.getReturnTypeNode()!.getText().trim()).toEqual(builtMethod.returnType.toString())
    expect(method.getNameNode().getText().trim()).toEqual(builtMethod.name)
    expect(method.getParameters().length).toEqual(builtMethod.params.length)
  }
})

test('buildSchema() should have correct name, num types, and num interfaces', () => {
  for (const source of makeTestFiles(project)) {
    const schema = buildSchema(source)
    expect(schema.fileName).toEqual(source.getBaseNameWithoutExtension())
    expect(schema.interfaces.length).toEqual(source.getInterfaces().length)
    expect(schema.types.length).toEqual(source.getTypeAliases().length)
  }
})

test('makeStruct() should return a struct with correct useCbor param set', () => {
  const file = getSourceFile(makeStructTestSource, project)
  const hasCbor = file.getTypeAlias('TestType1')!.getTypeNode()!.forEachChildAsArray()
  const noCbor = file.getTypeAlias('TestType2')!.getTypeNode()!.forEachChildAsArray()
  for (const node of hasCbor) {
    const type = makeDataType(getTypeNode(node))
    expect(is.Struct(type)).toBeTruthy()
    if (is.Struct(type)) {
      expect(type.useCbor).toBeTruthy()
    }
  }
  for (const node of noCbor) {
    const type = makeDataType(getTypeNode(node))
    expect(is.Struct(type)).toBeTruthy()
    if (is.Struct(type)) {
      expect(type.useCbor).toBeFalsy()
    }
  }
})
