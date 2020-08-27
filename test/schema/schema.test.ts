import {Project} from 'ts-morph'
import {getSourceFile, methodSchemaTestSource, schemaWithCbor, schemaWithoutCbor} from './util'
import {MutationMethod} from '../../src/schema'

const {buildSchema, buildMethod} = internalTesting
let method1: MutationMethod
let method2: MutationMethod
let method3: MutationMethod
let method4: MutationMethod
beforeAll(() => {
  const interfc = getSourceFile(methodSchemaTestSource, new Project()).getInterfaces()[0]
  method1 = buildMethod(interfc.getMethod('method1')!)
  method2 = buildMethod(interfc.getMethod('method2')!)
  method3 = buildMethod(interfc.getMethod('method3')!)
  method4 = buildMethod(interfc.getMethod('method4')!)
})

test('hasCborParams() method should return correct boolean', () => {
  expect(method1.hasCborParams).toBeTruthy()
  expect(method3.hasCborParams).toBeFalsy()
}
)

test('hasCborReturn() method should return correct boolean value', () => {
  expect(method2.hasCborReturn).toBeTruthy()
  expect(method1.hasCborReturn).toBeFalsy()
}
)

test('hasParams() method should return correct boolean value', () => {
  expect(method1.hasParams).toBeTruthy()
  expect(method2.hasParams).toBeFalsy()
})

test('hasCbor should return false when schema has not methods with cbor', () => {
  const file = getSourceFile(schemaWithoutCbor, new Project())
  const schema = buildSchema(file)
  expect(schema.hasCbor).toBeFalsy()
})

test('hasCbor should return true when schema has methods with cbor', () => {
  const file = getSourceFile(schemaWithCbor, new Project())
  const schema = buildSchema(file)
  expect(schema.hasCbor).toBeTruthy()
})

test('isVoidReturn should return correct boolean value', () => {
  expect(method4.isVoidReturn).toBeTruthy()
  expect(method3.isVoidReturn).toBeFalsy()
})
