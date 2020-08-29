/* eslint-disable new-cap */
import {genSourceFile, typesTestData} from '../util'
import {make, StructLiteral, testing} from '../../../src/schema'
import {Node, Project, TypeNode} from 'ts-morph'
import {$} from '@typerpc/types'

export const made: {[key: string]: Node| TypeNode} = {}

export const {makeDataType} = testing

beforeAll(() => {
  const {parseMsgProps} = testing
  const file = genSourceFile(typesTestData, new Project())
  const type = file.getTypeAliasOrThrow('TestType')
  const props = parseMsgProps(type)
  props.forEach(prop => {
    made[prop.getName()] = prop.getTypeNodeOrThrow()
  })
})

test('make.Struct should return struct with correct name and useCbor values', () => {
  expect(make.Struct(made.struct).name).toEqual('SomeStruct')
  expect(make.Struct(made.cborType).useCbor).toBeTruthy()
})

test('make.StructLiteral should return struct with correct number of properties', () => {
  const literal = make.StructLiteral(made.structLiteral, makeDataType) as StructLiteral
  expect(literal.properties.length).toEqual(4)
})

test('make.Tuple should return tuples with correct DataTypes', () => {
  const tuple2 = make.Tuple(made.tuple2, makeDataType) as $.Tuple2<any, any>
  const tuple3 = make.Tuple(made.tuple3, makeDataType) as $.Tuple3<any, any, any>
  const tuple4 = make.Tuple(made.tuple4, makeDataType) as $.Tuple4<any, any, any, any>
  const tuple5 = make.Tuple(made.tuple5, makeDataType) as $.Tuple5<any, any, any, any, any>
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
  expect(tuple5.item2.type).toEqual(make.err.type)
  expect(tuple5.item3.type).toEqual(make.dyn.type)
  expect(tuple5.item4.type).toEqual(make.blob.type)
  expect(tuple5.item5.type).toEqual(make.float32.type)
})

test('make.scalar should return the correct scalar type', () => {
  make.scalar(made.int8)!
})
