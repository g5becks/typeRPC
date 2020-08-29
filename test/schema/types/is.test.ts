/* eslint-disable new-cap */
import {Node, Project, TypeNode} from 'ts-morph'
import {is, make, testing} from '../../../src/schema'
import {genSourceFile, typesTestData} from '../util'
import 'array-flat-polyfill'

const types: {[key: string]: Node| TypeNode} = {}
const {makeDataType} = testing
beforeAll(() => {
  const {parseMsgProps} = testing
  const file = genSourceFile(typesTestData, new Project())
  const type = file.getTypeAliasOrThrow('TestType')
  const props = parseMsgProps(type)
  props.forEach(prop => {
    types[prop.getName()] = prop.getTypeNodeOrThrow()
  })
})

test('is.Dict() should return true when given valid $.Dict, false otherwise', () => {
  expect(is.Dict(make.Dict(types.dict, makeDataType))).toBeTruthy()
  expect(is.Dict(make.Tuple(types.tuple2, makeDataType))).toBeFalsy()
})

test('is.Tuple2() should return true when given a valid $.Tuple2, false otherwise', () => {
  expect(is.Tuple2(make.Tuple(types.tuple2, makeDataType))).toBeTruthy()
  expect(is.Tuple2(make.Tuple(types.tuple3, makeDataType))).toBeFalsy()
})

test('is.Tuple3() should return true when given a valid $.Tuple3, false otherwise', () => {
  expect(is.Tuple3(make.Tuple(types.tuple2, makeDataType))).toBeFalsy()
  expect(is.Tuple3(make.Tuple(types.tuple3, makeDataType))).toBeTruthy()
})

test('is.Tuple4() should return true when given a valid $.Tuple4, false otherwise', () => {
  expect(is.Tuple4(make.Tuple(types.tuple5, makeDataType))).toBeFalsy()
  expect(is.Tuple4(make.Tuple(types.tuple4, makeDataType))).toBeTruthy()
})

test('is.Tuple5() should return true when given a valid $.Tuple5, false otherwise', () => {
  expect(is.Tuple5(make.Tuple(types.tuple5, makeDataType))).toBeTruthy()
  expect(is.Tuple5(make.Tuple(types.tuple4, makeDataType))).toBeFalsy()
})

test('is.List() should return true when given a valid $.List, false otherwise', () => {
  expect(is.List(make.List(types.list, makeDataType))).toBeTruthy()
  expect(is.List(make.blob)).toBeFalsy()
})

test('is.Struct() should return true when given a valid rpc.Msg type, false otherwise', () => {
  expect(is.Struct(make.Struct(types.struct))).toBeTruthy()
  expect(is.Struct(make.StructLiteral(types.structLiteral, makeDataType))).toBeFalsy()
})

test('is.StructLiteral should return true when given a valid rpc.Msg literal type, false otherwise', () => {
  expect(is.StructLiteral(make.Struct(types.struct))).toBeFalsy()
  expect(is.StructLiteral(make.StructLiteral(types.structLiteral, makeDataType))).toBeTruthy()
})

test('is.Scalar should return true for all scalar types and false for all others', () => {
  expect(is.Scalar(make.timestamp)).toBeTruthy()
  expect(is.Scalar(make.int8)).toBeTruthy()
  expect(is.Scalar(make.uint8)).toBeTruthy()
  expect(is.Scalar(make.int16)).toBeTruthy()
  expect(is.Scalar(make.uint16)).toBeTruthy()
  expect(is.Scalar(make.int32)).toBeTruthy()
  expect(is.Scalar(make.uint32)).toBeTruthy()
  expect(is.Scalar(make.int64)).toBeTruthy()
  expect(is.Scalar(make.uint64)).toBeTruthy()
  expect(is.Scalar(make.float32)).toBeTruthy()
  expect(is.Scalar(make.float64)).toBeTruthy()
  expect(is.Scalar(make.str)).toBeTruthy()
  expect(is.Scalar(make.blob)).toBeTruthy()
  expect(is.Scalar(make.dyn)).toBeTruthy()
  expect(is.Scalar(make.unit)).toBeTruthy()
  expect(is.Scalar(make.nil)).toBeTruthy()
  expect(is.Scalar(make.List(types.list, makeDataType))).toBeFalsy()
  expect(is.Scalar(make.Dict(types.dict, makeDataType))).toBeFalsy()
  expect(is.Scalar(make.Tuple(types.tuple2, makeDataType))).toBeFalsy()
  expect(is.Scalar(make.Struct(types.struct))).toBeFalsy()
  expect(is.Scalar(make.StructLiteral(types.structLiteral, makeDataType))).toBeFalsy()
})
