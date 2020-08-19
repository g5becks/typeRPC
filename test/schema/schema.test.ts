import {Project} from 'ts-morph'
import {getSourceFile, methodSchemaTestSource, schemaWithCbor, schemaWithoutCbor} from './util'
import {internalTesting} from '../../src/schema/builder'
import {Method} from '../../src/schema'

const {buildSchema} = internalTesting
let method1: Method
let method2: Method
let method3: Method
beforeAll(() => {
  const interfc = getSourceFile(methodSchemaTestSource, new Project()).getInterfaces()[0]
  method1 = buildMethod(interfc.getMethod('method1')!)
  method2 = buildMethod(interfc.getMethod('method2')!)
  method3 = buildMethod(interfc.getMethod('method3')!)
})

const {buildMethod} = internalTesting

test('cborParams() method should return correct boolean', () => {
  expect(method1.cborParams).toBeTruthy()
  expect(method3.cborParams).toBeFalsy()
}
)

test('cborReturn() method should return correct boolean value', () => {
  expect(method2.cborReturn).toBeTruthy()
  expect(method1.cborReturn).toBeFalsy()
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
