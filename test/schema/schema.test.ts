import {Project} from 'ts-morph'
import {getSourceFile, methodSchemaTestSource} from './util'
import {internalTesting} from '../../src/schema/builder'
import {Method} from '../../src/schema'

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
  expect(method1.cborParams()).toBeTruthy()
  expect(method3.cborParams).toBeTruthy()
}
)

test('cborReturn() method should return correct boolean value', () => {
  expect(method2.cborReturn()).toBeTruthy()
  expect(method1.cborReturn()).toBeFalsy()
}
)

test('hasParams() method should return correct boolean value', () => {
  expect(method1.hasParams()).toBeTruthy()
  expect(method2.hasParams())
})

