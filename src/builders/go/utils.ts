import {DataType, is, make, Message, Property} from '../../schema'
import {Schema} from '../../schema/schema'
import {capitalize, lowerCase} from '../utils'

export const typeMap: Map<string, string> = new Map<string, string>(
  [
    [make.bool.type, 'bool'],
    [make.int8.type, 'int8'],
    [make.uint8.type, 'uint8'],
    [make.int16.type, 'int16'],
    [make.uint16.type, 'uint16'],
    [make.int32.type, 'int32'],
    [make.uint32.type, 'uint32'],
    [make.int64.type, 'int64'],
    [make.uint64.type, 'uint64'],
    [make.float32.type, 'float32'],
    [make.float64.type, 'float64'],
    [make.nil.type, 'struct{}'],
    [make.str.type, 'string'],
    [make.err.type, 'error'],
    [make.dyn.type, 'interface{}'],
    [make.timestamp.type, 'time.Time'],
    [make.unit.type, ''],
    [make.blob.type, 'byte'],

  ]
)

// Converts the input dataType into a Go representation
export const dataType = (type: DataType): string => {
  if (!is.container(type) && !is.scalar(type)) {
    throw new TypeError(`invalid data type: ${type.toString()}`)
  }

  if (is.scalar(type)) {
    return typeMap.get(type.type)!
  }

  if (is.map(type)) {
    return `map[string]${dataType(type.valType)}`
  }

  if (is.list(type)) {
    return `[]${dataType(type.dataType)}`
  }

  if (is.struct(type)) {
    return type.name
  }

  if (is.structLiteral(type)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return `struct{${buildProps(type.properties)}}`
  }

  if (is.tuple2(type)) {
    return `(${dataType(type.item1)}, ${dataType(type.item2)})`
  }

  if (is.tuple3(type)) {
    return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)})`
  }

  if (is.tuple4(type)) {
    return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)})`
  }

  if (is.tuple5(type)) {
    return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)}, ${dataType(type.item5)})`
  }

  return 'interface{}'
}
const buildProps = (props: ReadonlyArray<Property>): string => {
  let properties = ''
  for (const prop of props) {
    properties = properties.concat(`${capitalize(prop.name)}  ${prop.isOptional ? '*' : ''}${dataType(prop.type)}\n`)
  }
  return properties
}
const buildType = (type: Message): string => {
  return `
type ${type.isExported ? capitalize(type.name) : lowerCase(type.name)} struct {
    ${buildProps(type.properties)}
}
`
}
const buildTypes = (schema: Schema): string => {
  let types = ''
  for (const type of schema.messages) {
    types  = types.concat(buildType(type))
  }
  return types
}
