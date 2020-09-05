/* eslint-disable new-cap */
import {genSourceFile, typesTestData} from '../../test-utils/lib'
import {make, StructLiteral, testing} from '../../../src/schema'
import {Node, Project, TypeNode} from 'ts-morph'
import {$, internal as _} from '@typerpc/types'

export const types: {[key: string]: Node| TypeNode} = {}

export const {makeDataType} = testing

beforeAll(() => {
  const {parseMsgProps} = testing
  const file = genSourceFile(typesTestData, new Project())
  const type = file.getTypeAliasOrThrow('TestType')
  const props = parseMsgProps(type)
  props.forEach(prop => {
    types[prop.getName()] = prop.getTypeNodeOrThrow()
  })
})

test('make.struct should return struct with correct name and useCbor values', () => {
  expect(make.struct(types.struct).name).toEqual('SomeStruct')
  expect(make.struct(types.cborType).useCbor).toBeTruthy()
})

test('make.structLiteral should return struct with correct number of properties', () => {
  const literal = make.structLiteral(types.structLiteral, makeDataType) as StructLiteral
  expect(literal.properties.length).toEqual(4)
})

test('make.tuple should return tuples with correct DataTypes', () => {
  const tuple2 = make.tuple(types.tuple2, makeDataType) as $.tuple2<any, any>
  const tuple3 = make.tuple(types.tuple3, makeDataType) as $.tuple3<any, any, any>
  const tuple4 = make.tuple(types.tuple4, makeDataType) as $.tuple4<any, any, any, any>
  const tuple5 = make.tuple(types.tuple5, makeDataType) as $.tuple5<any, any, any, any, any>
  expect(tuple2.item1.type).toEqual(make.int8.type)
  expect(tuple2.item2.type).toEqual(make.int8.type)
  expect(tuple3.item1.type).toEqual(make.int8.type)
  expect(tuple3.item2.type).toEqual(make.int16.type)
  expect(tuple3.item3.type).toEqual(make.uint16.type)
  expect(tuple4.item1.type).toEqual(make.int8.type)
  expect(tuple4.item2.type).toEqual(make.str.type)
  expect(tuple4.item3.type).toEqual(make.bool.type)
  expect(tuple4.item4.type).toEqual(make.timestamp.type)
  expect(tuple5.item1.type).toEqual(make.str.type)
  expect(tuple5.item2.type).toEqual(make.str.type)
  expect(tuple5.item3.type).toEqual(make.dyn.type)
  expect(tuple5.item4.type).toEqual(make.blob.type)
  expect(tuple5.item5.type).toEqual(make.float32.type)
})

test('make.scalar should return the correct scalar type', () => {
  const expectScalar = (type: Node|TypeNode, expected: _.Scalar) => expect(make.scalar(type)?.type).toEqual(expected.type)
  expectScalar(types.int8, make.int8)
  expectScalar(types.uint8, make.uint8)
  expectScalar(types.int16, make.int16)
  expectScalar(types.uint16, make.uint16)
  expectScalar(types.int32, make.int32)
  expectScalar(types.uint32, make.uint32)
  expectScalar(types.int64, make.int64)
  expectScalar(types.uint64, make.uint64)
  expectScalar(types.float32, make.float32)
  expectScalar(types.float64, make.float64)
  expectScalar(types.str, make.str)
  expectScalar(types.timestamp, make.timestamp)
  expectScalar(types.blob, make.blob)
  expectScalar(types.dyn, make.dyn)
  expectScalar(types.unit, make.unit)
  expectScalar(types.nil, make.nil)
})

test('make.map should return $.map with correct keyType and valType', () => {
  const dict = make.map(types.dict, makeDataType) as $.map<any, any>
  expect(dict.keyType.toString()).toEqual('$.int8')
  expect(dict.valType.toString()).toEqual('$.int8')
})

test('make.list should return $.list with correct tsDataType', () => {
  const list = make.list(types.list, makeDataType) as $.list<any>
  expect(list.dataType.toString()).toEqual('$.bool')
})

