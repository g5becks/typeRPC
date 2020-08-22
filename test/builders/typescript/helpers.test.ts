/* eslint-disable new-cap */
import {DataType, isQueryParamable, make, prim} from '../../../src/schema/types'
import {dataType, fromQueryString} from '../../../src/builders/typescript/helpers'

const typesMap: Map<DataType, string> = new Map<DataType, string>([
  [make.Struct('Test', false), 'Test'],
  [make.List(make.Dict(prim.bool, make.List(prim.int8))), 'Array<Map<boolean, Array<number>>>'],
  [make.Dict(prim.int8, make.Tuple2(prim.blob, prim.err)), 'Map<number, [Uint8Array, Error]>'],
  [make.Tuple2(make.Dict(prim.bool, prim.int64), prim.timestamp), '[Map<boolean, number>, number]'],
  [make.Tuple3(make.Tuple2(prim.bool, make.List(prim.str)), prim.int32, make.Struct('Gary', false)), '[[boolean, Array<string>], number, Gary]'],
  [make.Tuple5(make.List(prim.str), make.Tuple2(prim.nil, prim.dyn), prim.blob, make.List(make.Struct('Me', false)), make.Tuple4(prim.dyn, prim.bool, prim.nil, prim.timestamp)), '[Array<string>, [null, any], Uint8Array, Array<Me>, [any, boolean, null, number]]'],
])

const params: [string, DataType, string][] = [
  ['name', prim.str, 'name'],
  ['age', prim.int32, 'parseInt(age)'],
  ['userId', prim.int8, 'parseInt(userId)'],
  ["'false'", prim.bool, "Boolean('false')"],
  ["['gary', 'tonya', 'lisa', 'tony']", make.List(prim.str), "['gary', 'tonya', 'lisa', 'tony']"],
  ['1598052267851', prim.timestamp, 'parseInt(1598052267851)'],
  ['barbara', make.List(prim.timestamp), 'barbara.map(val => parseInt(val))'],
  ['accuracy', prim.float32, 'parseFloat(accuracy)'],
]

test('dataType() should return correct typescript type', () => {
  for (const [key, val] of typesMap.entries()) {
    expect(dataType(key)).toEqual(val)
  }
})

test('fromQueryString() should return correct parser function', () => {
  for (const [param, type, parser] of params) {
    if (isQueryParamable(type)) {
      expect(fromQueryString(param, type)).toEqual(parser)
    }
  }
})

test('buildTypes() should return correct types', () => {

})
