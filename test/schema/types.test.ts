/* eslint-disable */
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
  expect(is.Tuple2(make.Tuple2(primitives.int8, primitives.bool))).toBeTruthy()
})

test('is.Tuple3() should return correct value', () => {
  expect(is.Tuple3(make.Tuple4(primitives.bool, primitives.bool, primitives.bool, primitives.bool))).toBeFalsy()
  expect(is.Tuple3(make.Tuple3(primitives.bool, primitives.bool, primitives.bool))).toBeTruthy()
})

test('is.Tuple4() should return correct value', () => {
  expect(is.Tuple4(make.Tuple2(primitives.dyn, primitives.dyn))).toBeFalsy()
  expect(is.Tuple4(make.Tuple4(primitives.dyn, primitives.dyn, primitives.dyn, primitives.dyn))).toBeTruthy()
})

test('is.Tuple5() should return correct value', () => {
  expect(is.Tuple5(make.Tuple2(primitives.dyn, primitives.dyn))).toBeFalsy()
  expect(is.Tuple5(make.Tuple5(primitives.dyn, primitives.int8, primitives.dyn, primitives.dyn, primitives.bool))).toBeTruthy()
})

test('is.List() should return correct value', () => {
  expect(is.List(12)).toBeFalsy()
  expect(is.List(make.Tuple2(primitives.dyn, primitives.dyn))).toBeFalsy()
  expect(is.List(make.List(primitives.bool))).toBeTruthy()
})


test('is.Container() should return false when passed non container value', () => {
  const vals = [primitives.dyn, primitives.int8, primitives.int16, primitives.unit]
  for (const val of vals) {
    expect(is.Container(val)).toBeFalsy()
  }
})

test('is.Container() should return true when passed a container', () => {
  const vals = [make.Struct('me'), make.List(primitives.bool), make.Dict(primitives.int8, primitives.bool), make.Tuple2(primitives.bool, primitives.bool), make.Tuple3(primitives.bool, primitives.bool, primitives.bool), make.Tuple4(primitives.bool, primitives.bool, primitives.bool, primitives.bool), make.Tuple5(primitives.bool, primitives.bool, primitives.bool, primitives.bool, primitives.bool)]
  for (const val of vals) {
    expect(is.Container(val)).toBeTruthy()
  }
})
