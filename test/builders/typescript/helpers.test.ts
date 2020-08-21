import {DataType, make, primitives} from '../../../src/schema/types'
import {dataType} from '../../../src/builders/typescript/helpers'

const typesMap: Map<DataType, string> = new Map<DataType, string>([
  [make.Struct('Test', false), 'Test'],
  [make.List(make.Dict(primitives.bool, make.List(primitives.int8))), 'Array<Map<boolean, Array<number>>>'],
  [make.Dict<primitives.int8>],
])

test('dataType() should return correct typescript type', () => {
  for (const [key, val] of typesMap.entries()) {
    expect(dataType(key)).toEqual(val)
  }
})
