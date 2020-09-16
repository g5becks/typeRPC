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

export const helpers = (packageName: string) => `
package ${packageName}

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/fxamacker/cbor"
	"github.com/go-resty/resty"
	"net/http"
	"strconv"
	"time"
)

func setHeaders(req *resty.Request, headers ...map[string]string) *resty.Request  {
		if len(headers) > 0 {
		for _, h := range  headers {
			req.SetHeaders(h)
		}
	}
	return req
}

//nolint:unparam
func marshalBody(v interface{}, isCbor bool) ([]byte, error) {
	if isCbor {
		data, err := cbor.Marshal(v)
		if err != nil {
			return data, NewRPCError(http.StatusBadRequest, "failed to marshal cbor data", err)
		}
	}
	data, err := json.Marshal(v)
	if err != nil {
		return data, NewRPCError(http.StatusBadRequest, "failed to marshal json data", err)
	}

	return data, nil
}

type requestData struct {
	Method string
	Request *resty.Request
	Url string
	CborBody bool
	CborResponse bool
	Body interface{}
	Out interface{}
}

func makeRequest(ctx context.Context, data requestData) error {
	var resp *resty.Response
	var err error
	var respData []byte
	if ctx.Err() != nil {
		return NewRPCError(http.StatusRequestTimeout, "request aborted context done", ctx.Err())
	}
	if data.Method == "GET" {
		resp, err = data.Request.Get(data.Url)
		if err != nil {
			var status int
			if resp != nil {
				status = resp.StatusCode()
			} else {
				status = http.StatusBadRequest
			}
			return NewRPCError(status, "rpc request failed", err)
		}
	} else if data.Method == "POST" {
		if data.Body != nil {
			respData, err = marshalBody(data.Body, data.CborBody)
			if err != nil {
				return err
			}
		}
		if respData != nil {
			data.Request.SetBody(respData)
		}
		resp, err = data.Request.Post(data.Url)
		if err != nil {
			var status int
			if resp != nil {
				status = resp.StatusCode()
			} else {
				status = http.StatusBadRequest
			}
			return NewRPCError(status, "rpc request failed", err)
		}
	}

	if data.Out != nil {
		if data.CborResponse {
			err = cbor.Unmarshal(resp.Body(), data.Out)
		} else {
			err = json.Unmarshal(resp.Body(), data.Out)
		}
		if err != nil {
			return NewRPCError(http.StatusBadRequest, "failed to marshal request respData", err)
		}
		if err = ctx.Err(); err != nil {
			return NewRPCError(http.StatusRequestTimeout, "request aborted, context done", err)
		}
	}
	return nil
}

func Int8sToStrings(params []int8) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.Itoa(int(param))
	}

	return list
}

func Int16sToStrings(params []int16) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.Itoa(int(param))
	}

	return list
}

func Int32sToStrings(params []int32) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.Itoa(int(param))
	}

	return list
}

func Int64sToStrings(params []int64) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.Itoa(int(param))
	}

	return list
}

func Uint8sToStrings(params []uint8) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatUint(uint64(param), 10)
	}

	return list
}

func Uint16sToStrings(params []uint16) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatUint(uint64(param), 10)
	}

	return list
}
func Uint32sToStrings(params []uint32) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatUint(uint64(param), 10)
	}

	return list
}

func Uint64sToStrings(params []uint64) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatUint(param, 10)
	}

	return list
}

func Float32sToStrings(params []float32) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatFloat(float64(param), 'e', -1, 32)
	}

	return list
}

func Float64sToStrings(params []float64) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatFloat(param, 'e', -1, 32)
	}

	return list
}

func BoolsToStrings(params []bool) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatBool(param)
	}

	return list
}

func TimestampsToStrings(params []time.Time) []string {
	list := make([]string, len(params))
	for i, param := range params {
		list[i] = strconv.FormatInt(param.Unix(), 10)
	}

	return list
}

type ErrorPayload struct {
	Code  int    \`json:"code"\`
	Cause string \`json:"cause,omitempty"\`
	Msg   string \`json:"msg"\`
	Error string \`json:"error"\`
}

type RPCError interface {
	// Code is of the valid error codes
	Code() int

	// Msg returns a human-readable, unstructured messages describing the error
	Msg() string

	// Cause is reason for the error
	Cause() error

	// RPCError returns a string of the form "typerpc error <Code>: <Msg>"
	Error() string

	// RPCError response payload
	Payload() ErrorPayload
}

type rpcErr struct {
	code  int
	msg   string
	cause error
}

func NewRPCError(code int, msg string, cause error) *rpcErr {
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
`
