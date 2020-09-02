/* eslint-disable new-cap */
import {DataType, queryParamables, scalarsMap, Struct, StructLiteral} from './data-type'
import {$, internal as x} from '@typerpc/types'

const validateType = (type: unknown, ...propNames: string[]): boolean => {
  const props = Object.getOwnPropertyNames(type).filter(prop => !prop.includes('toString'))
  return propNames.every(name => props.includes(name)) && props.length === propNames.length
}
// validate every TupleN type by ensuring it has itemN property names.
const validateTuple = (type: unknown, numItems: number): boolean => {
  let props: string[] = []
  let i = 0
  while (i < numItems) {
    props = props.concat(`item${i + 1}`)
    i++
  }
  return validateType(type, ...props)
}
// functions to validate the type of a variable
export const is = {
  Dict: (type: unknown): type is $.map<$.str, x.Paramable> => validateType(type, 'keyType', 'valType'),
  Tuple2: (type: unknown): type is $.tuple2<x.Paramable, x.Paramable> => validateTuple(type, 2),
  Tuple3: (type: unknown): type is $.tuple3<x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 3),
  Tuple4: (type: unknown): type is $.tuple4<x.Paramable, x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 4),
  Tuple5: (type: unknown): type is $.tuple5<x.Paramable, x.Paramable, x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 5),
  List: (type: unknown): type is $.list<x.Paramable> => validateType(type, 'dataType'),
  Struct: (type: unknown): type is Struct => validateType(type, 'name', 'useCbor'),
  StructLiteral: (type: unknown): type is StructLiteral => validateType(type, 'properties'),
  Container: (type: unknown): boolean => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5, is.StructLiteral].some(func => func(type)),
  QueryParamable: (type: DataType): boolean => queryParamables.some(param => type.toString().startsWith(param)),
  Scalar: (type: any): type is x.Scalar => !is.Container(type) && scalarsMap.has(type.toString()),
  DataType: (type: any): type is DataType => is.Container(type) || scalarsMap.has(type.toString()),
}
