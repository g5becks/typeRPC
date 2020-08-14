// file deepcode ignore no-unused-expression: test file
// file deepcode ignore semicolon: conflict with eslint
import {Project} from 'ts-morph'
import {validateSchemas} from '../../src/schema/validator'

let project: Project

beforeEach(() => {
  project = new Project()
})

const runTest = (project: Project, source: string, errLength: number): void => {
  project.createSourceFile('test.ts', source)
  expect(validateSchemas([project.getSourceFile('test.ts')!]).length).toBe(errLength)
}

test('validateSchemas() returns 1 Error when schema contains functions', () => {
  const source = `
  import {t} from '@typerpc/types'
  function name() {
  }

  interface Test {
    getNames(name: t.str): t.bool
  }
  `
  runTest(project, source, 1)
})

test('validateSchemas() return 1 Error when schema contains 2 functions', () => {
  const source = `
  import {t} from '@typerpc/types'
  function name() {
  }

  function name2() {
  }

  interface Test {
    getNames(name: t.str): t.bool
  }
  `
  runTest(project, source, 1)
})
