// file deepcode ignore no-unused-expression: test file
// file deepcode ignore semicolon: conflict with eslint
import {Project} from 'ts-morph'
import {sourceWithValidImportAndInterface, validQuerySvc} from './util'
import {validateSchemas} from '../../src/schema/validator'

let project: Project

beforeEach(() => {
  project = new Project()
})

const testName = (errCount: number, contains: string): string => `validateSchemas() returns ${errCount} Error when schema contains ${contains}`

const runTest = (project: Project, source: string, errLength: number): void => {
  project.createSourceFile('test.ts', source)
  expect(validateSchemas([project.getSourceFile('test.ts')!]).length).toBe(errLength)
}

test(testName(1, 'method with invalid param type'), () => {
  const source = `
  interface Person {
    getName(num: number): t.str;
  }`

  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'method with invalid return type'), () => {
  const source = `
  interface Person {
    getName(): string;
    }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'method with typeless param'), () => {
  const source = `
  interface Person {
    getName(num): t.unit;
  }`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'generic method'), () => {
  const source = `
  interface PersonService {
  getPeople<T>(person: t.str): t.str;
}`
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test(testName(1, 'non Object type alias'), () => {
  const nested = 't.Dict<t.str, People>'
  const source = `
  type PeopleMap = ${nested}
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test('validateSchema should return 0 error when given a valid schema file', () => {
  const people = 't.List<source>'
  const nested = 't.Dict<t.str, People>'
  const source = `
  type Person = {
    name: t.str;
    age: t.int8;
  }

  type PersonList = {
    list: ${people}
    }

  type PeopleMap = {
    map: ${nested}
    }

  interface PersonService {
    getPersonByName(name: t.str): Person;
    getPeopleAboveAge(age: t.int8): PersonList;
    getPeopleMap(): PeopleMap;
  }
  `
  runTest(project, sourceWithValidImportAndInterface(source), 0)
})
