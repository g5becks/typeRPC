import {is, make, primitives} from '../../src/schema/types'

test('is.Struct() should return correct value', () => {
  expect(is.Struct(make.Struct('gare'))).toBeTruthy()
  expect(is.Struct(10)).toBeFalsy()
})

test('is.Dict() should return correct value', () => {
  expect(is.Dict(make.Dict(primitives.int8, primitives.bool))).toBeTruthy()
  expect(is.Dict(make.Tuple2(primitives.int8, primitives.bool))).toBeFalsy()
})

test('is.Tuple2() should return correct value', () => {
  expect(is.Tuple2(make.Tuple3(primitives.int8, primitives.int8, primitives.bool))).toBeFalsy()
  const tuple = make.Tuple2(primitives.int8, primitives.bool)
  console.log(tuple.toString)
  expect(is.Tuple2(make.Tuple2(primitives.int8, primitives.bool))).toBeTruthy()
})
