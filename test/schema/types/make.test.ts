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
  console.log(tuple2.item1.toString())
  expect(tuple2.item1).toEqual(make.int8)
  expect(tuple2.item2).toEqual(make.int8)
})
