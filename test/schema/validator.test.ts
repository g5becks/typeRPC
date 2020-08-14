import {Project} from 'ts-morph'
import {validateSchemas} from '../../src/schema/validator'

const project = new Project()

test('validateSchemas() returns error when schema contains functions', () => {
  const func = `const func = () => {
  }`
  project.createSourceFile('function.ts', func)
  const file = project.getSourceFile('function.ts')!
  console.log(file)
  const res = validateSchemas([project.getSourceFile('function.ts')!])
})
