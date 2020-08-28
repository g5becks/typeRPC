import {Project} from 'ts-morph'
import {testing} from '../../../src/schema'
import {genMsgNames, genServices, genSourceFile} from '../util'

let project: Project

const {parseQueryServices, parseServiceMethods} = testing

beforeEach(() => {
  project = new Project()
})

const {
  validateService,
  validateNotGeneric,
  validateReturnType,
  validateMethodJsDoc,
  validateQueryMethodParams,
} = testing

test('validateService() should not return error when service is valid', () => {
  const services = parseQueryServices(genSourceFile(genServices('Query', genMsgNames()), project))
  for (const service of services) {
    expect(validateService(service).length).toBe(0)
  }
})

test('validateMethodJsDoc() should return an error when @return tag has invalid status', () => {
  const source = `
  interface Test {
    /** @returns 0 */
    method()
  }`
  const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
  expect(validateMethodJsDoc(method).length).toEqual(1)
})

test('validateMethodJsDoc() should NOT return an error when @return tag has valid status', () => {
  const source = `
  interface Test {
    /** @returns 301 */
    method()
  }`
  const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
  expect(validateMethodJsDoc(method).length).toEqual(0)
})

test('validateMethodJsDoc() should NOT return an error when @throws tag has valid status', () => {
  const source = `
  interface Test {
    /** @throws 501 */
    method()
  }`
  const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
  expect(validateMethodJsDoc(method).length).toEqual(0)
})

test('validateMethodJsDoc() should return an error when @throws tag has invalid status', () => {
  const source = `
  interface Test {
    /** @throws 550 */
    method()
  }`
  const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
  expect(validateMethodJsDoc(method).length).toEqual(1)
})
