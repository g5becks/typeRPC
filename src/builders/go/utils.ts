import {DataType, is, make, Message, MutationMethod, Param, Property, QueryService, Schema} from '../../schema'
import {MutationService, QueryMethod} from '../../schema/schema'
import {capitalize, lowerCase} from '../utils'
import {ChildProcess, exec} from 'child_process'

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
    [make.dyn.type, 'interface{}'],
    [make.timestamp.type, 'time.Time'],
    [make.unit.type, 'error'],
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
    return `(error, ${dataType(type.item1)}, ${dataType(type.item2)})`
  }

  if (is.tuple3(type)) {
    return `(error, ${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)})`
  }

  if (is.tuple4(type)) {
    return `(error, ${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)})`
  }

  if (is.tuple5(type)) {
    return `(error, ${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)}, ${dataType(type.item5)})`
  }

  return 'interface{}'
}

const handleOptional = (isOptional: boolean): string => isOptional ? '*' : ''

const buildProps = (props: ReadonlyArray<Property>): string => {
  let properties = ''
  for (const prop of props) {
    properties = properties.concat(`${capitalize(prop.name)}  ${handleOptional(prop.isOptional)}${dataType(prop.type)}\n`)
  }
  return properties
}
const buildType = (type: Message): string => {
  return `
type ${capitalize(type.name)} struct {
    ${buildProps(type.properties)}
}
`
}

export const buildTypes = (messages: ReadonlyArray<Message>): string => {
  let types = ''
  for (const msg of messages) {
    types  = types.concat(buildType(msg))
  }
  return types
}

const buildMethodParams = (params: ReadonlyArray<Param>): string => {
  let parameters = ''
  let i = 0
  while (i < params.length) {
    const useComma = i === params.length - 1 ? '' : ', '
    parameters = parameters.concat(`${lowerCase(params[i].name)} ${handleOptional(params[i].isOptional)}${dataType(params[i].type)}${useComma}`)
    i++
  }
  return parameters
}

const buildReturnType = (type: DataType): string => {
  if (is.dataType(type) !== true) {
    throw new TypeError(`invalid data type: ${type.toString()}`)
  }
  if (is.scalar(type) && type.type === 'unit') {
    return 'error'
  }
  if (is.tuple2(type) || is.tuple3(type) || is.tuple4(type) || is.tuple5(type)) {
    return dataType(type)
  }
  return `(error, ${dataType(type)})`
}

const buildMethodSignature = (method: MutationMethod | QueryMethod): string => {
  return `
  ${capitalize(method.name)}(${buildMethodParams(method.params)}) ${buildReturnType(method.returnType)}
  `
}

const buildInterfaceMethods = (methods: ReadonlyArray<MutationMethod| QueryMethod>): string => {
  let signatures = ''
  for (const method of methods) {
    signatures = signatures.concat(buildMethodSignature(method))
  }
  return signatures
}

const buildInterface = (service: MutationService| QueryService): string => {
  return `
 type ${capitalize(service.name)} interface {
    ${buildInterfaceMethods(service.methods)}
 }`
}

export const buildFileName = (fileName: string): string =>
  fileName.includes('-') ? fileName.split('-').join('_') + '.go' : fileName + '.go'

export const buildInterfaces = (schema: Schema): string => {
  let interfaces = ''
  for (const svc of schema.queryServices) {
    interfaces = interfaces.concat(buildInterface(svc))
  }
  for (const svc of schema.mutationServices) {
    interfaces = interfaces.concat(buildInterface(svc))
  }
  return interfaces
}

export const format = (path: string): ChildProcess => exec(`gofmt -w ${path}`, (error, stdout, stderr) => {
  if (error) {
    // eslint-disable-next-line no-console
    console.log(`error: ${error.message}`)
    return
  }
  if (stderr) {
    // eslint-disable-next-line no-console
    console.log(`stderr: ${stderr}`)
    return
  }
  // eslint-disable-next-line no-console
  console.log(`formatting complete: ${stdout}`)
})

