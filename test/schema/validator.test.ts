// file deepcode ignore no-unused-expression: test file
// file deepcode ignore semicolon: conflict with eslint
import {Project} from 'ts-morph'
import {validateSchemas} from '../../src/schema/validator'

let project: Project

beforeEach(() => {
  project = new Project()
})

const testName = (errCount: number, contains: string): string => `validateSchemas() returns ${errCount} Error when schema contains ${contains}`

const validImport = 'import {t} from \'@typerpc/types\''
const validInterface = `
  interface Test {
    getNames(name: t.str): t.bool
  }
  `
const sourceWithValidImportAndInterface = (source: string) => `
${validImport}
${source}
${validInterface}
`

const runTest = (project: Project, source: string, errLength: number): void => {
  project.createSourceFile('test.ts', source)
  const res = validateSchemas([project.getSourceFile('test.ts')!])
  res.forEach(res => console.log(res.message))
  expect(res.length).toBe(errLength)
}

test(testName(1, 'function'), () => {
  const source = `
  function name() {
  }
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'multiple functions'), () => {
  const source = `
  function name() {
  }

  function name2() {
  }
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'variable declaration'), () => {
  const source = `
  var names: string = 'gary'
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'class declaration'), () => {
  const source = `
  class MyClass {
  private name: string = ''
  }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'extra imports'), () => {
  const source = `
  import * as path from 'path'
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'aliased @typerpc import'), () => {
  const source = `
  import {t as v} from '@typerpc/types'
  ${validInterface}
  `
  runTest(project, source, 1)
})

test(testName(1, 'export'), () => {
  const source = `
  export default interface {
    name() : t.str;
  }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'namespace'), () => {
  const source = `
  namespace Cars {
    export type Fake = string | boolean
  }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'for loop'), () => {
  const source = `
  for (let q of [1,2,3]) {
  }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'enum'), () => {
  const source = `
  enum Colors {
    Red,
    Blue,
    Green,
  }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'invalid type alias'), () => {
  const typeName = 'GenericType<T, S, V>'
  const source = `
type ${typeName} = {
  name: T;
  age: t.str;
}
  `
  console.log(source)
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})
