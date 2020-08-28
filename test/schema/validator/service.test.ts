import {Project} from 'ts-morph'
import {testing} from '../../../src/schema'
import {genMsgNames, genServices, genSourceFile} from '../util'

let project: Project

beforeEach(() => {
  project = new Project()
})

const {
  validateService,
  validateNotGeneric,
  validateReturnType,
  validateMethodJsDoc,
  validateQueryMethodParams,
  parseQueryServices,
  parseServiceMethods,
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

test('validateMethodNotGeneric() should return an error when method is generic', () => {
  const source = `
  type SomeSvc = rpc.MutationSvc<{
    getNames<T extends $.int8>(namesSlot: T): $.List<$.str>;
  }>`
  const method = parseServiceMethods(genSourceFile(source, project).getTypeAlias('SomeSvc')!)[0]
  expect(validateNotGeneric(method).length).toEqual(1)
})
