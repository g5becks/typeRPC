import {DataType, make} from '../../../src/schema/types'

const typesMap: Map<DataType, string> = new Map<DataType, string>([
  [make.Struct('Test', false), 'Test'],
])

test('dataType() should return correct typescript type', () => {

})
