/* eslint-disable new-cap */
import { DataType, queryParamables, scalarsMap, Struct, StructLiteral } from './data-type'
import { $, internal as x } from '@typerpc/types'

const validateType = (type: unknown, ...propNames: string[]): boolean => {
    const props = Object.getOwnPropertyNames(type).filter((prop) => !prop.includes('toString'))
    return propNames.every((name) => props.includes(name)) && props.length === propNames.length
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
    map: (type: unknown): type is $.map<$.str, x.Paramable> => validateType(type, 'keyType', 'valType'),
    tuple2: (type: unknown): type is $.tuple2<x.Paramable, x.Paramable> => validateTuple(type, 2),
    tuple3: (type: unknown): type is $.tuple3<x.Paramable, x.Paramable, x.Paramable> => validateTuple(type, 3),
    tuple4: (type: unknown): type is $.tuple4<x.Paramable, x.Paramable, x.Paramable, x.Paramable> =>
        validateTuple(type, 4),
    tuple5: (type: unknown): type is $.tuple5<x.Paramable, x.Paramable, x.Paramable, x.Paramable, x.Paramable> =>
        validateTuple(type, 5),
    list: (type: unknown): type is $.list<x.Paramable> => validateType(type, 'dataType'),
    struct: (type: unknown): type is Struct => validateType(type, 'name', 'useCbor'),
    structLiteral: (type: unknown): type is StructLiteral => validateType(type, 'properties'),
    container: (type: unknown): boolean =>
        [
            is.struct,
            is.list,
            is.map,
            is.tuple2,
            is.tuple3,
            is.tuple4,
            is.tuple3,
            is.tuple5,
            is.structLiteral,
        ].some((func) => func(type)),
    queryParamable: (type: DataType): boolean => queryParamables.some((param) => type.toString().startsWith(param)),
    scalar: (type: any): type is x.Scalar => !is.container(type) && scalarsMap.has(type.toString()),
    dataType: (type: any): type is DataType => is.container(type) || is.scalar(type),
}
