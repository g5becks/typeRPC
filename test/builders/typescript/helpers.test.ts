/* eslint-disable new-cap */
import {DataType, make, prim} from '../../../src/schema/types'
import {dataType} from '../../../src/builders/typescript/helpers'

const typesMap: Map<DataType, string> = new Map<DataType, string>([
  [make.Struct('Test', false), 'Test'],
  [make.List(make.Dict(prim.bool, make.List(prim.int8))), 'Array<Map<boolean, Array<number>>>'],
  [make.Dict(prim.int8, make.Tuple2(prim.blob, prim.err)), 'Map<number, [Uint8Array, Error]>'],
])

test('dataType() should return correct typescript type', () => {
  for (const [key, val] of typesMap.entries()) {
    expect(dataType(key)).toEqual(val)
  }
})
