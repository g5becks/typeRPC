/* eslint-disable new-cap */
import {fetch} from '../../../src/schema/types'
import {dataType, fromQueryString} from '../../../src/builders/typescript/helpers'
import {DataType} from '../../../src/schema/types/data-type'
import {make} from '../../../src/schema/types/make'
import {isQueryParamable} from '../../../src/schema/types/is'

const typesMap: Map<DataType, string> = new Map<DataType, string>([
  [make.Struct('Test', false), 'Test'],
  [make.List(make.Dict(fetch.bool, make.List(fetch.int8))), 'Array<Map<boolean, Array<number>>>'],
  [make.Dict(fetch.int8, make.Tuple2(fetch.blob, fetch.err)), 'Map<number, [Uint8Array, Error]>'],
  [make.Tuple2(make.Dict(fetch.bool, fetch.int64), fetch.timestamp), '[Map<boolean, number>, number]'],
  [make.Tuple3(make.Tuple2(fetch.bool, make.List(fetch.str)), fetch.int32, make.Struct('Gary', false)), '[[boolean, Array<string>], number, Gary]'],
  [make.Tuple5(make.List(fetch.str), make.Tuple2(fetch.nil, fetch.dyn), fetch.blob, make.List(make.Struct('Me', false)), make.Tuple4(fetch.dyn, fetch.bool, fetch.nil, fetch.timestamp)), '[Array<string>, [null, any], Uint8Array, Array<Me>, [any, boolean, null, number]]'],
])

const params: [string, DataType, string][] = [
  ['name', fetch.str, 'name'],
  ['age', fetch.int32, 'parseInt(age)'],
  ['userId', fetch.int8, 'parseInt(userId)'],
  ["'false'", fetch.bool, "Boolean('false')"],
  ["['gary', 'tonya', 'lisa', 'tony']", make.List(fetch.str), "['gary', 'tonya', 'lisa', 'tony']"],
  ['1598052267851', fetch.timestamp, 'parseInt(1598052267851)'],
  ['barbara', make.List(fetch.timestamp), 'barbara.map(val => parseInt(val))'],
  ['accuracy', fetch.float32, 'parseFloat(accuracy)'],
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

test('buildTypes() should return correct messages', () => {

})
