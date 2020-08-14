// file deepcode ignore no-unused-expression: test file
// file deepcode ignore semicolon: conflict with eslint
import {Project} from 'ts-morph'
import {validateSchemas} from '../../src/schema/validator'

let project: Project

beforeEach(() => {
  project = new Project()
})

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

test('validateSchemas() returns 1 Error when schema contains functions', () => {
  const source = `
  function name() {
  }
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test('validateSchemas() return 1 Error when schema contains 2 functions', () => {
  const source = `
  function name() {
  }

  function name2() {
  }
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})

test('validateSchemas() returns 1 Error when schema contains variable declaration', () => {
  const source = `
  var names: string = 'gary'
  `
  runTest(project, sourceWithValidImportAndInterface(source), 1)
})
