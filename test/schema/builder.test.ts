/* eslint-disable new-cap */
import {Project} from 'ts-morph'
import {prims} from '../../src/schema/types'

import {genSourceFile, makeStructTestSource, makeTestFile, makeTestFiles, testController, testProp} from './util'
import {containers} from '../../src/schema/types/data-type'
import {is} from '../../src/schema'

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

test('buildResponseCode() should return correct HttpResponse', () => {
  const methods = genSourceFile(testController, project).getInterfaces()[0].getMethods()
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

test('buildSchema() should have correct name, num messages, and num services', () => {
  for (const source of makeTestFiles(project)) {
    const schema = buildSchema(source)
    expect(schema.fileName).toEqual(source.getBaseNameWithoutExtension())
    expect(schema.services.length).toEqual(source.getInterfaces().length)
    expect(schema.messages.length).toEqual(source.getTypeAliases().length)
  }
})

test('makeStruct() should return a struct with correct useCbor param set', () => {
  const file = genSourceFile(makeStructTestSource, project)
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
