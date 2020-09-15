"use strict";
/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpers = exports.buildInterfaces = exports.buildFileName = exports.buildResponseStruct = exports.buildResultInitializers = exports.buildResultDeclarations = exports.buildParamNames = exports.parseReqBody = exports.parseQueryParams = exports.buildInterface = exports.buildInterfaceMethods = exports.buildMethodSignature = exports.buildReturnType = exports.buildMethodParams = exports.buildTypes = exports.buildType = exports.buildProps = exports.handleOptional = exports.fromQueryString = exports.scalarFromQueryParam = exports.dataType = exports.typeMap = void 0;
const schema_1 = require("@typerpc/schema");
const plugin_utils_1 = require("@typerpc/plugin-utils");
exports.typeMap = new Map([
    [schema_1.make.bool.type, 'bool'],
    [schema_1.make.int8.type, 'int8'],
    [schema_1.make.uint8.type, 'uint8'],
    [schema_1.make.int16.type, 'int16'],
    [schema_1.make.uint16.type, 'uint16'],
    [schema_1.make.int32.type, 'int32'],
    [schema_1.make.uint32.type, 'uint32'],
    [schema_1.make.int64.type, 'int64'],
    [schema_1.make.uint64.type, 'uint64'],
    [schema_1.make.float32.type, 'float32'],
    [schema_1.make.float64.type, 'float64'],
    [schema_1.make.nil.type, 'struct{}'],
    [schema_1.make.str.type, 'string'],
    [schema_1.make.dyn.type, 'interface{}'],
    [schema_1.make.timestamp.type, 'time.Time'],
    [schema_1.make.unit.type, 'error'],
    [schema_1.make.blob.type, '[]byte'],
]);
// Converts the input dataType into a Go representation
exports.dataType = (type) => {
    if (!schema_1.is.container(type) && !schema_1.is.scalar(type)) {
        throw new TypeError(`invalid data type: ${type.toString()}`);
    }
    if (schema_1.is.scalar(type)) {
        const ret = exports.typeMap.get(type.type);
        if (ret) {
            return ret;
        }
        throw new TypeError(`invalid data type ${type}`);
    }
    if (schema_1.is.map(type)) {
        return `map[string]${exports.dataType(type.valType)}`;
    }
    if (schema_1.is.list(type)) {
        return `[]${exports.dataType(type.dataType)}`;
    }
    if (schema_1.is.struct(type)) {
        // default structs to being pointers
        return '*' + type.name;
    }
    if (schema_1.is.structLiteral(type)) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return `*struct{${exports.buildProps(type.properties)}}`;
    }
    if (schema_1.is.tuple2(type)) {
        return `${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}`;
    }
    if (schema_1.is.tuple3(type)) {
        return `${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}`;
    }
    if (schema_1.is.tuple4(type)) {
        return `${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}, ${exports.dataType(type.item4)}`;
    }
    if (schema_1.is.tuple5(type)) {
        return `${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}, ${exports.dataType(type.item4)}, ${exports.dataType(type.item5)}`;
    }
    return 'interface{}';
};
exports.scalarFromQueryParam = (param, type) => {
    if (schema_1.is.scalar(type) !== true) {
        throw new TypeError('invalid type used in QuerySvc');
    }
    if (schema_1.is.scalar(type)) {
        switch (type.type) {
            case 'blob':
                return `StringToBytes(${param})`;
            case 'str':
                return param;
            default:
                // delegate all other types to helper functions
                return `StringTo${plugin_utils_1.capitalize(exports.dataType(type))}(${param})`;
        }
    }
    return '';
};
exports.fromQueryString = (param, type) => {
    if (schema_1.is.scalar(type)) {
        return exports.scalarFromQueryParam(param, type);
    }
    if (!schema_1.is.list(type)) {
        throw new TypeError('invalid type used in QuerySvc');
    }
    if (schema_1.is.list(type)) {
        if (schema_1.is.scalar(type.dataType)) {
            switch (type.dataType.type) {
                case 'blob':
                    return `StringsToBytes(${param})`;
                case 'str':
                    return param;
                default:
                    // delegate all other types to helper functions
                    return `StringsTo${plugin_utils_1.capitalize(exports.dataType(type.dataType))}s(${param})`;
            }
        }
    }
    return '';
};
exports.handleOptional = (property) =>
// if type is a scalar, make it a pointer (optional)
schema_1.is.scalar(property.type) && property.isOptional ? '*' : '';
exports.buildProps = (props) => {
    let properties = '';
    for (const prop of props) {
        properties = properties.concat(`${plugin_utils_1.capitalize(prop.name)}  ${exports.handleOptional(prop)}${exports.dataType(prop.type)} \`json:"${plugin_utils_1.lowerCase(prop.name)}"\`\n`);
    }
    return properties;
};
exports.buildType = (type) => {
    return `
type ${plugin_utils_1.capitalize(type.name)} struct {
    ${exports.buildProps(type.properties)}
}
`;
};
exports.buildTypes = (messages) => {
    let types = '';
    for (const msg of messages) {
        types = types.concat(exports.buildType(msg));
    }
    return types;
};
exports.buildMethodParams = (params) => {
    let parameters = '';
    let i = 0;
    while (i < params.length) {
        const useComma = i === params.length - 1 ? '' : ', ';
        parameters = parameters.concat(`${plugin_utils_1.lowerCase(params[i].name)} ${exports.handleOptional(params[i])}${exports.dataType(params[i].type)}${useComma}`);
        i++;
    }
    return parameters;
};
exports.buildReturnType = (type) => {
    if (schema_1.is.dataType(type) !== true) {
        throw new TypeError(`invalid data type: ${type.toString()}`);
    }
    if (schema_1.is.scalar(type) && type.type === 'unit') {
        return 'error';
    }
    return `(${exports.dataType(type)}, error)`;
};
exports.buildMethodSignature = (method) => {
    return `
  ${plugin_utils_1.capitalize(method.name)}(ctx context.Context${method.hasParams ? ', ' : ''}${exports.buildMethodParams(method.params)}) ${exports.buildReturnType(method.returnType)}
  `;
};
exports.buildInterfaceMethods = (methods) => {
    let signatures = '';
    for (const method of methods) {
        signatures = signatures.concat(exports.buildMethodSignature(method));
    }
    return signatures;
};
exports.buildInterface = (service) => {
    return `
 type ${plugin_utils_1.capitalize(service.name)} interface {
    ${exports.buildInterfaceMethods(service.methods)}
 }
 `;
};
const parseParam = (param) => (schema_1.is.list(param.type) ? `q["${param.name}"]` : `q.Get("${param.name}")`);
// builds a string representation of go code
// that parses all of the query params location an *http.Request struct
exports.parseQueryParams = (method) => {
    let parsed = `q := r.URL.Query()
  \n`;
    for (const param of method.params) {
        parsed = parsed.concat(`${param.name}, err := ${exports.fromQueryString(parseParam(param), param.type)}
        if err != nil {
          RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})
          return
        }
        `);
    }
    return parsed;
};
exports.parseReqBody = (method) => {
    if (method.params.length === 0) {
        return '';
    }
    if (schema_1.isQueryMethod(method)) {
        return exports.parseQueryParams(method);
    }
    let props = '';
    for (const param of method.params) {
        props = props.concat(`${plugin_utils_1.capitalize(param.name)} ${exports.dataType(param.type)} \`json:"${plugin_utils_1.lowerCase(param.name)}"\`
      `);
    }
    return `rCont := struct {
        ${props}
    }{}
    err = parseReqBody(r, &rCont, ${method.hasCborParams ? 'true' : 'false'} )
		if err != nil {
			RespondWithErr(w, err, ${method.hasCborReturn ? 'true' : 'false'})
			return
		}
`;
};
// builds the names of params to use for calling a method
exports.buildParamNames = (method) => {
    const params = method.params;
    let paramString = '';
    let i = 0;
    while (i < params.length - 1) {
        const useComma = i === params.length - 1 ? '' : ', ';
        paramString = schema_1.isQueryMethod(method)
            ? paramString.concat(`${params[i].name}${useComma}`)
            : paramString.concat(`rCont.${plugin_utils_1.capitalize(params[i].name)}${useComma}`);
        i++;
    }
    return paramString;
};
// builds the variable declaration(s) to store the return value(s) of a method call
exports.buildResultDeclarations = (type) => {
    if (schema_1.is.tuple2(type)) {
        return `var item1 ${exports.dataType(type)}
              var item2 ${exports.dataType(type)}
              `;
    }
    if (schema_1.is.tuple3(type)) {
        return `var item1 ${exports.dataType(type)}
              var item2 ${exports.dataType(type)}
              var item3 ${exports.dataType(type)}
              `;
    }
    if (schema_1.is.tuple4(type)) {
        return `var item1 ${exports.dataType(type)}
              var item2 ${exports.dataType(type)}
              var item3 ${exports.dataType(type)}
              var item4 ${exports.dataType(type)}
              `;
    }
    if (schema_1.is.tuple5(type)) {
        return `var item1 ${exports.dataType(type)}
              var item2 ${exports.dataType(type)}
              var item3 ${exports.dataType(type)}
              var item4 ${exports.dataType(type)}
              var item5 ${exports.dataType(type)}
              `;
    }
    return `var res ${exports.dataType(type)}`;
};
// builds the variable initializer(s) for a return values of a method call
exports.buildResultInitializers = (type) => {
    if (schema_1.is.tuple2(type)) {
        return `item1, item2, err`;
    }
    if (schema_1.is.tuple3(type)) {
        return `item1, item2, item3, err`;
    }
    if (schema_1.is.tuple4(type)) {
        return `item1, item2, item3, item4, err`;
    }
    if (schema_1.is.tuple5(type)) {
        return `item1, item2, item3, item4, item5, err`;
    }
    return `res, err`;
};
exports.buildResponseStruct = (type) => {
    let responseType = '';
    let response = exports.buildResultInitializers(type).replace(', err', '');
    if (schema_1.is.tuple2(type) || schema_1.is.tuple3(type) || schema_1.is.tuple4(type) || schema_1.is.tuple5(type)) {
        responseType = '[]interface{}';
        response = `[]interface{}{${response}}`;
    }
    else {
        responseType = exports.dataType(type);
    }
    return `response := struct {
      Data ${responseType}  \`json:"data"\`
  }{${response}}`;
};
exports.buildFileName = (fileName) => fileName.includes('-') ? fileName.split('-').join('_') + '.go' : fileName + '.go';
exports.buildInterfaces = (schema) => {
    let interfaces = '';
    for (const svc of schema.queryServices) {
        interfaces = interfaces.concat(exports.buildInterface(svc));
    }
    for (const svc of schema.mutationServices) {
        interfaces = interfaces.concat(exports.buildInterface(svc));
    }
    return interfaces;
};
exports.helpers = (pkgName) => `
package ${pkgName}
func marshalResponse(v interface{}, isCbor bool) ([]byte, error) {
	if isCbor {
		data, err := cbor.Marshal(v)
		if err != nil {
			return data,NewRpcError(http.StatusInternalServerError, "failed to marshal cbor response", err)
		}
	}
	data, err := json.Marshal(v)
	if err != nil {
		return data, NewRpcError(http.StatusInternalServerError, "failed to marshal json response", err)
	}
	return data, nil
}

func parseReqBody(r *http.Request, v interface{}, isCbor bool) error {
	reqBody, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		return NewRpcError(http.StatusInternalServerError, "failed to read request body",  err)
	}
	if isCbor {
		err := cbor.Unmarshal(reqBody, v)
		if err != nil {
			return  NewRpcError(http.StatusBadRequest, "failed unmarshall cbor request data", err)
		}
	}
	err = json.Unmarshal(reqBody, v)
	if err != nil {
		return NewRpcError(http.StatusBadRequest, "failed unmarshall json request data", err)
	}
	return nil
}

func handlePanic(w http.ResponseWriter, isCbor bool) {

	// If panic occurs, serve a 500 error and then panic.
	if rr := recover(); rr != nil {
		RespondWithErr(w, errors.New("internal"), isCbor)
		panic(rr)
	}

}

type ctxKey struct {
	kind string
}

func (k *ctxKey) String() string {
	return "typerpc context value " + k.kind
}

var handlerKey = &ctxKey{"HTTPHandler"}

func HTTPHandlerName(ctx context.Context) string {
	return ctx.Value(handlerKey).(string)
}

type ErrorPayload struct {
	Code  int    \`json:"code"\`
	Cause string \`json:"cause,omitempty"\`
	Msg   string \`json:"msg"\`
	Error string \`json:"error"\`
}

type RpcError interface {
	// Code is of the valid error codes
	Code() int

	// Msg returns a human-readable, unstructured messages describing the error
	Msg() string

	// Cause is reason for the error
	Cause() error

	// RpcError returns a string of the form "typerpc error <Code>: <Msg>"
	Error() string

	// RpcError response payload
	Payload() ErrorPayload
}

type rpcErr struct {
	code  int
	msg   string
	cause error
}

func NewRpcError(code int, msg string, cause error) *rpcErr {
	return &rpcErr{code: code, msg: msg, cause: cause}
}
func (e *rpcErr) Code() int {
	return e.code
}

func (e *rpcErr) Msg() string {
	return e.msg
}

func (e *rpcErr) Cause() error {
	return e.cause
}

func (e *rpcErr) Error() string {
	if e.cause != nil && e.cause.Error() != "" {
		if e.msg != "" {
			return fmt.Sprintf("typerpc %d error: %s -- %s", e.code, e.cause.Error(), e.msg)
		} else {
			return fmt.Sprintf("typerpc %d error: %s", e.code, e.cause.Error())
		}
	} else {
		return fmt.Sprintf("typerpc %d error: %s", e.code, e.msg)
	}
}

func (e *rpcErr) Payload() ErrorPayload {
	errPayload := ErrorPayload{
		Code:  e.Code(),
		Msg:   e.Msg(),
		Error: e.Error(),
	}
	if e.Cause() != nil {
		errPayload.Cause = e.Cause().Error()
	}
	return errPayload
}

func RespondWithErr(w http.ResponseWriter, err error, isCbor bool) {
	var e *rpcErr
	if !errors.As(err, &e) {
		e = NewRpcError(http.StatusInternalServerError, "typerpc error", err)
	}
	w.WriteHeader(e.code)
	var respBody []byte
	if isCbor {
			w.Header().Set("Content-Type", "application/cbor")
		body, _ := cbor.Marshal(e.Payload())
		respBody = body

	} else {
		w.Header().Set("Content-Type", "application/json")
		body, _ := json.Marshal(e.Payload())
		respBody = body
	}
	w.Write(respBody)
}

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
`;
//# sourceMappingURL=index.js.map
