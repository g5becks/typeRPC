import {DataType, QueryParamable, queryParamables, Struct, StructLiteral} from './data-type'
import {$, internal as x} from '@typerpc/types'

// TODO test this function
// determines if the type text is a valid QueryParamable Type
export const isQueryParamableString = (type: string): boolean => queryParamables.some(paramable => type.toString().startsWith(paramable))

export const isQueryParamable = (type: DataType): type is QueryParamable => isQueryParamableString(type.toString())
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
  Dict: (type: unknown): type is $.Dict<x.Comparable, x.Paramable> => validateType(type, 'keyType', 'valType'),
  Tuple2: (type: unknown): type is $.Tuple2<x.Paramable, x.Paramable> => validateTuple(type, 2),
  Tuple3: (type: unknown): type is $.Tuple3<x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 3),
  Tuple4: (type: unknown): type is $.Tuple4<x.Paramable, x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 4),
  Tuple5: (type: unknown): type is $.Tuple5<x.Paramable, x.Paramable, x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 5),
  List: (type: unknown): type is $.List<x.Paramable> => validateType(type, 'dataType'),
  Struct: (type: unknown): type is Struct => validateType(type, 'name', 'useCbor'),
  StructLiteral: (type: unknown): type is StructLiteral => validateType(type, 'properties'),
  Container: (type: DataType): boolean => [is.Struct, is.List, is.Dict, is.Tuple2, is.Tuple3, is.Tuple4, is.Tuple3, is.Tuple5, is.StructLiteral].some(func => func(type)),
}
