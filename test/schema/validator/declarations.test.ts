import {Project, SourceFile} from 'ts-morph'
import {testing} from '../../../src/schema'
import {genSourceFile} from '../util'
import {run} from '@oclif/command'

let project: Project

beforeEach(() => {
  project = new Project()
})
const {
  validateTypes,
  validateJsDoc,
  validateExports,
  validateImports,
  validateEnums,
  validateNameSpaces,
  validateClasses,
  validateStatements,
  validateVariables,
  validateInterfaces,
  validateFunctions,

} = testing

const testName = (type: string) => `validate ${type}s should return an error for each ${type} found in a schema file`

const runTest = (source: string, validator: (file: SourceFile) => Error[]) => {
  expect(validator(genSourceFile(source, project)).length).toEqual(1)
}

test(testName('function'), () => {
  runTest(`
  function name() {
  }
  `, validateFunctions,)
})

test(testName('interface'), () => {
  runTest(`
  interface Name {
  }`, validateInterfaces)
})

test(testName('multiple function'), () => {
  runTest(`
  function name() {
  }

  function name2() {
  }
  `, validateFunctions)
})

test(testName('variable declaration'), () => {
  runTest(`
  var names: string = 'gary'
  `, validateVariables)

  runTest(`
  const me: number = 1`, validateVariables)
  runTest(`
  let you: number = 2`, validateVariables)
})

test(testName('class declaration'), () => {
  runTest(`
  class MyClass {
  private name: string = ''
  }`, validateClasses)
})
