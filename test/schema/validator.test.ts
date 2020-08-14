// file deepcode ignore no-unused-expression: test file
// file deepcode ignore semicolon: conflict with eslint
import {Project} from 'ts-morph'
import {validateSchemas} from '../../src/schema/validator'

let project: Project

beforeEach(() => {
  project = new Project()
})

test('validateSchemas() returns error when schema contains functions', () => {
  const func = `
  import {t} from '@typerpc/types'
  function name() {
  }

  interface Test {
  }
  `
  project.createSourceFile('function.ts', func)
  const res = validateSchemas([project.getSourceFile('function.ts')!])
  // eslint-disable-next-line no-console
  res.forEach(err => console.log(err.message))
  expect(res.length).toBe(2)
})
