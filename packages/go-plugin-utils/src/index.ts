import {
    DataType,
    is,
    make,
    Message,
    MutationMethod,
    Param,
    Property,
    QueryService,
    Schema,
    MutationService,
    QueryMethod,
} from '@typerpc/schema'
import { capitalize, lowerCase } from '@typerpc/plugin-utils'

export const typeMap: Map<string, string> = new Map<string, string>([
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
    [make.blob.type, '[]byte'],
])

// Converts the input dataType into a Go representation
export const dataType = (type: DataType): string => {
    if (!is.container(type) && !is.scalar(type)) {
        throw new TypeError(`invalid data type: ${type.toString()}`)
    }

    if (is.scalar(type)) {
        const ret = typeMap.get(type.type)
        if (ret) {
            return ret
        }
        throw new TypeError(`invalid data type ${type}`)
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
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, error)`
    }

    if (is.tuple3(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, error)`
    }

    if (is.tuple4(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}, error)`
    }

    if (is.tuple5(type)) {
        return `(${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}, ${dataType(type.item5)}, error)`
    }

    return 'interface{}'
}

export const scalarFromQueryParam = (paramName: string, type: DataType): string => {
    if (is.scalar(type) !== true) {
        throw new TypeError('invalid type used in QuerySvc')
    }
    if (is.scalar(type)) {
        switch (type.type) {
            case 'blob':
                return `StringToBytes(${paramName})`
            case 'str':
                return paramName
            default:
                // delegate all other types to helper functions
                return `StringTo${capitalize(dataType(type))}(${paramName})`
        }
    }
    return ''
}

export const fromQueryString = (paramName: string, type: DataType): string => {
    if (is.scalar(type)) {
        return scalarFromQueryParam(paramName, type)
    }
    if (!is.list(type)) {
        throw new TypeError('invalid type used in QuerySvc')
    }
    if (is.list(type)) {
        if (is.scalar(type.dataType)) {
            switch (type.dataType.type) {
                case 'blob':
                    return `StringsToBytes(${paramName})`
                case 'str':
                    return paramName
                default:
                    // delegate all other types to helper functions
                    return `StringsTo${capitalize(dataType(type.dataType))}s(${paramName})`
            }
        }
    }
    return ''
}

export const handleOptional = (property: Property): string =>
    is.scalar(property.type) || is.struct(property.type) || (is.structLiteral(property.type) && property.isOptional)
        ? '*'
        : ''

export const buildProps = (props: ReadonlyArray<Property>): string => {
    let properties = ''
    for (const prop of props) {
        properties = properties.concat(
            `${capitalize(prop.name)}  ${handleOptional(prop)}${dataType(prop.type)} \`json:"${lowerCase(
                prop.name,
            )}"\`\n`,
        )
    }
    return properties
}

export const buildType = (type: Message): string => {
    return `
type ${capitalize(type.name)} struct {
    ${buildProps(type.properties)}
}
`
}

export const buildTypes = (messages: ReadonlyArray<Message>): string => {
    let types = ''
    for (const msg of messages) {
        types = types.concat(buildType(msg))
    }
    return types
}

export const buildMethodParams = (params: ReadonlyArray<Param>): string => {
    let parameters = ''
    let i = 0
    while (i < params.length) {
        const useComma = i === params.length - 1 ? '' : ', '
        parameters = parameters.concat(
            `${lowerCase(params[i].name)} ${handleOptional(params[i])}${dataType(params[i].type)}${useComma}`,
        )
        i++
    }
    return parameters
}

export const buildReturnType = (type: DataType): string => {
    if (is.dataType(type) !== true) {
        throw new TypeError(`invalid data type: ${type.toString()}`)
    }
    if (is.scalar(type) && type.type === 'unit') {
        return 'error'
    }
    if (is.tuple2(type) || is.tuple3(type) || is.tuple4(type) || is.tuple5(type)) {
        return dataType(type)
    }
    return `(${dataType(type)}, error)`
}

export const buildMethodSignature = (method: MutationMethod | QueryMethod): string => {
    return `
  ${capitalize(method.name)}(ctx context.Context${method.hasParams ? ', ' : ''}${buildMethodParams(
        method.params,
    )}) ${buildReturnType(method.returnType)}
  `
}

export const buildInterfaceMethods = (methods: ReadonlyArray<MutationMethod | QueryMethod>): string => {
    let signatures = ''
    for (const method of methods) {
        signatures = signatures.concat(buildMethodSignature(method))
    }
    return signatures
}

export const buildInterface = (service: MutationService | QueryService): string => {
    return `
 type ${capitalize(service.name)} interface {
    ${buildInterfaceMethods(service.methods)}
 }
 `
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

export const helpers = `
func StringToTimestamp(t string) (time.Time, error) {
	parsed, err := strconv.ParseInt(t, 0, 64)
	if err != nil {
		return time.Time{}, err
	}
	return time.Unix(parsed, 0), nil
}

func StringToBool(param string) (bool, error) {
	i, err := strconv.ParseBool(param)
	if err != nil {
		return false, err
	}
	return i, nil
}

func StringToBytes(param string) ([]byte, error) {
	return []byte(param), nil
}

func StringToFloat32(param string) (float32, error) {
	i, err := strconv.ParseFloat(param, 32)
	if err != nil {
		return 0, err
	}
	return float32(i), nil
}

func StringToFloat64(param string) (float64, error) {
	i, err := strconv.ParseFloat(param, 64)
	if err != nil {
		return 0, err
	}
	return i, nil
}

func StringToInt8(param string) (int8, error) {
	i, err := strconv.ParseInt(param, 0, 8)
	if err != nil {
		return 0, err
	}
	return int8(i), nil
}

func StringToUint8(param string) (uint8, error) {
	i, err := strconv.ParseUint(param, 0, 8)
	if err != nil {
		return 0, err
	}
	return uint8(i), nil
}

func StringToInt16(param string) (int16, error) {
	i, err := strconv.ParseInt(param, 0, 16)
	if err != nil {
		return 0, err
	}
	return int16(i), nil
}

func StringToUint16(param string) (uint16, error) {
	i, err := strconv.ParseUint(param, 0, 16)
	if err != nil {
		return 0, err
	}
	return uint16(i), nil
}

func StringToInt32(param string) (int32, error) {
	i, err := strconv.ParseInt(param, 0, 32)
	if err != nil {
		return 0, err
	}
	return int32(i), nil
}

func StringToUint32(param string) (uint32, error) {
	i, err := strconv.ParseUint(param, 0, 32)
	if err != nil {
		return 0, err
	}
	return uint32(i), nil
}

func StringToInt64(param string) (int64, error) {
	i, err := strconv.ParseInt(param, 0, 64)
	if err != nil {
		return 0, err
	}
	return i, nil
}

func StringToUint64(param string) (uint64, error) {
	i, err := strconv.ParseUint(param, 0, 64)
	if err != nil {
		return 0, err
	}
	return i, nil
}

func StringsToTimeStamps(params []string) ([]time.Time, error) {
	l := make([]time.Time, len(params))
	for i, str := range params {
		f, err := StringToTimestamp(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToBools(params []string) ([]bool, error) {
	l := make([]bool, len(params))
	for i, str := range params {
		f, err := StringToBool(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToBytes(params []string) ([][]byte, error) {
	l := make([][]byte, len(params))
	for i, str := range params {
		l[i] = []byte(str)
	}
	return l, nil
}

func StringsToFloat32s(params []string) ([]float32, error) {
	l := make([]float32, len(params))
	for i, str := range params {
		f, err := StringToFloat32(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToFloat64s(params []string) ([]float64, error) {
	l := make([]float64, len(params))
	for i, str := range params {
		f, err := StringToFloat64(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToInt8s(params []string) ([]int8, error) {
	l := make([]int8, len(params))
	for i, str := range params {
		f, err := StringToInt8(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToUint8s(params []string) ([]uint8, error) {
	l := make([]uint8, len(params))
	for i, str := range params {
		f, err := StringToUint8(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToInt16s(params []string) ([]int16, error) {
	l := make([]int16, len(params))
	for i, str := range params {
		f, err := StringToInt16(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToUint16s(params []string) ([]uint16, error) {
	l := make([]uint16, len(params))
	for i, str := range params {
		f, err := StringToUint16(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToInt32s(params []string) ([]int32, error) {
	l := make([]int32, len(params))
	for i, str := range params {
		f, err := StringToInt32(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToUint32s(params []string) ([]uint32, error) {
	l := make([]uint32, len(params))
	for i, str := range params {
		f, err := StringToUint32(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToInt64s(params []string) ([]int64, error) {
	l := make([]int64, len(params))
	for i, str := range params {
		f, err := StringToInt64(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}

func StringsToUint64s(params []string) ([]uint64, error) {
	l := make([]uint64, len(params))
	for i, str := range params {
		f, err := StringToUint64(str)
		if err != nil {
			return l, err
		}
		l[i] = f
	}
	return l, nil
}
`
