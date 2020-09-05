/* eslint-disable new-cap */
import { Node, Project, TypeNode } from 'ts-morph'
import { is, make, testing } from '../../../src/schema'
import { genSourceFile, typesTestData } from '../../test-utils/src'

const types: { [key: string]: Node | TypeNode } = {}
const { makeDataType } = testing
beforeAll(() => {
    const { parseMsgProps } = testing
    const file = genSourceFile(typesTestData, new Project())
    const type = file.getTypeAliasOrThrow('TestType')
    const props = parseMsgProps(type)
    props.forEach((prop) => {
        types[prop.getName()] = prop.getTypeNodeOrThrow()
    })
})

test('is.map() should return true when given valid $.map, false otherwise', () => {
    expect(is.map(make.map(types.dict, makeDataType))).toBeTruthy()
    expect(is.map(make.tuple(types.tuple2, makeDataType))).toBeFalsy()
})

test('is.tuple2() should return true when given a valid $.tuple2, false otherwise', () => {
    expect(is.tuple2(make.tuple(types.tuple2, makeDataType))).toBeTruthy()
    expect(is.tuple2(make.tuple(types.tuple3, makeDataType))).toBeFalsy()
})

test('is.tuple3() should return true when given a valid $.tuple3, false otherwise', () => {
    expect(is.tuple3(make.tuple(types.tuple2, makeDataType))).toBeFalsy()
    expect(is.tuple3(make.tuple(types.tuple3, makeDataType))).toBeTruthy()
})

test('is.tuple4() should return true when given a valid $.tuple4, false otherwise', () => {
    expect(is.tuple4(make.tuple(types.tuple5, makeDataType))).toBeFalsy()
    expect(is.tuple4(make.tuple(types.tuple4, makeDataType))).toBeTruthy()
})

test('is.tuple5() should return true when given a valid $.tuple5, false otherwise', () => {
    expect(is.tuple5(make.tuple(types.tuple5, makeDataType))).toBeTruthy()
    expect(is.tuple5(make.tuple(types.tuple4, makeDataType))).toBeFalsy()
})

test('is.list() should return true when given a valid $.list, false otherwise', () => {
    expect(is.list(make.list(types.list, makeDataType))).toBeTruthy()
    expect(is.list(make.blob)).toBeFalsy()
})

test('is.struct() should return true when given a valid rpc.Msg type, false otherwise', () => {
    expect(is.struct(make.struct(types.struct))).toBeTruthy()
    expect(is.struct(make.structLiteral(types.structLiteral, makeDataType))).toBeFalsy()
})

test('is.structLiteral should return true when given a valid rpc.Msg literal type, false otherwise', () => {
    expect(is.structLiteral(make.struct(types.struct))).toBeFalsy()
    expect(is.structLiteral(make.structLiteral(types.structLiteral, makeDataType))).toBeTruthy()
})

test('is.scalar should return true for all scalar types and false for all others', () => {
    expect(is.scalar(make.timestamp)).toBeTruthy()
    expect(is.scalar(make.int8)).toBeTruthy()
    expect(is.scalar(make.uint8)).toBeTruthy()
    expect(is.scalar(make.int16)).toBeTruthy()
    expect(is.scalar(make.uint16)).toBeTruthy()
    expect(is.scalar(make.int32)).toBeTruthy()
    expect(is.scalar(make.uint32)).toBeTruthy()
    expect(is.scalar(make.int64)).toBeTruthy()
    expect(is.scalar(make.uint64)).toBeTruthy()
    expect(is.scalar(make.float32)).toBeTruthy()
    expect(is.scalar(make.float64)).toBeTruthy()
    expect(is.scalar(make.str)).toBeTruthy()
    expect(is.scalar(make.blob)).toBeTruthy()
    expect(is.scalar(make.dyn)).toBeTruthy()
    expect(is.scalar(make.unit)).toBeTruthy()
    expect(is.scalar(make.nil)).toBeTruthy()
    expect(is.scalar(make.list(types.list, makeDataType))).toBeFalsy()
    expect(is.scalar(make.map(types.dict, makeDataType))).toBeFalsy()
    expect(is.scalar(make.tuple(types.tuple2, makeDataType))).toBeFalsy()
    expect(is.scalar(make.struct(types.struct))).toBeFalsy()
    expect(is.scalar(make.structLiteral(types.structLiteral, makeDataType))).toBeFalsy()
})
