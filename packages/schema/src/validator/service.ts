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

import { MethodSignature, ParameterDeclaration, SourceFile, TypeAliasDeclaration } from 'ts-morph'
import { isValidDataType, singleValidationErr, validateNotGeneric } from './utils'
import { parseQueryServices, parseServiceMethods } from '../parser'
import { queryParamables, HTTPErrCode, HTTPResponseCode } from '../index'

// Valid HTTP error codes
export const errCodes = [
    400,
    401,
    402,
    403,
    404,
    405,
    406,
    407,
    408,
    409,
    410,
    411,
    412,
    413,
    414,
    415,
    416,
    417,
    418,
    422,
    425,
    426,
    428,
    429,
    431,
    451,
    500,
    501,
    502,
    503,
    504,
    505,
    506,
    507,
    508,
    510,
    511,
]

// Valid HTTP success status codes
export const responseCodes = [200, 201, 202, 203, 204, 205, 206, 300, 301, 302, 303, 304, 305, 306, 307, 308]

// is the number used in the JsDoc @returns tag a valid typerpc HTTPResponseCode?
export const isResponseCode = (code: number | undefined): code is HTTPResponseCode => responseCodes.includes(code ?? 0)

// is the number used in the JsDoc @throws tag a valid typerpc HTTPErrCode?
export const isErrCode = (code: number | undefined): code is HTTPErrCode => errCodes.includes(code ?? 0)

const validateMethodJsDoc = (method: MethodSignature): Error[] => {
    const tags = method.getJsDocs()[0]?.getTags()
    if (typeof tags === 'undefined' || tags.length === 0) {
        return []
    }
    const errs: Error[] = []
    for (const tag of tags) {
        const tagName = tag.getTagName()
        const comment = tag?.getComment()?.trim() ?? ''
        if (tagName === 'throws') {
            const err = singleValidationErr(
                tag,
                `${comment} is not a valid HTTP error response code. Valid error response codes are : ${errCodes}`,
            )
            try {
                // eslint-disable-next-line radix
                if (!isErrCode(parseInt(comment))) {
                    errs.push(err)
                }
            } catch (error) {
                errs.push(err)
            }
        }
        if (tagName === 'kind' && comment.toLowerCase() !== 'cbor') {
            errs.push(
                singleValidationErr(
                    tag,
                    `invalid usage of @kind tag. The only valid value for the @kind tag is 'cbor', found: ${comment}`,
                ),
            )
        }
        if (tagName === 'returns') {
            const err = singleValidationErr(
                tag,
                `${tag.getComment()} is not a valid HTTP success response code. Valid success response codes are : ${responseCodes}`,
            )
            try {
                // eslint-disable-next-line radix
                if (!isResponseCode(parseInt(comment))) {
                    errs.push(err)
                }
            } catch (error) {
                errs.push(err)
            }
        }
    }
    return errs
}

const validateQueryMethodParam = (param: ParameterDeclaration): Error[] => {
    return queryParamables.some((val) => param.getTypeNode()!.getText().trim().startsWith(val))
        ? []
        : [
              singleValidationErr(
                  param,
                  `${param.getName()} has an invalid type. Methods annotated with @access GET are only allowed to use the following types for parameters: ${queryParamables}. Note: a t.List<> can only use one of the mentioned primitive types as a type parameter`,
              ),
          ]
}

// validates that all methods of an rpc.QuerySvc have valid params
const validateQueryMethodParams = (method: MethodSignature): Error[] => {
    const params = method.getParameters()
    if (params.length === 0) {
        return []
    }
    return params.flatMap((param) => validateQueryMethodParam(param))
}

// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same project.
const validateReturnType = (method: MethodSignature): Error[] => {
    if (typeof method.getReturnTypeNode() === 'undefined') {
        return [
            singleValidationErr(
                method,
                `${method.getName()} has an invalid return type. All rpc.Service methods must return a valid typerpc type, an rpc.Msg literal, or an rpc.Msg defined in the same file. To return nothing, use 't.unit'`,
            ),
        ]
    }
    return isValidDataType(method.getReturnTypeNode())
        ? []
        : [
              singleValidationErr(
                  method,
                  `${method.getName()} has an invalid return type. All rpc.Service methods must return a valid typerpc type, an rpc.Msg literal, or an rpc.Msg defined in the same file. To return nothing, use 't.unit'`,
              ),
          ]
}
// Ensure type of method params is either a typerpc type or a type
// declared in the same source project.
const validateParams = (method: MethodSignature): Error[] =>
    // eslint-disable-next-line no-negated-condition
    !method.getParameters()
        ? []
        : method
              .getParameters()
              .map((param) => param.getTypeNode())
              .flatMap((type) =>
                  isValidDataType(type)
                      ? []
                      : singleValidationErr(
                            type,
                            `method parameter type '${type
                                ?.getText()
                                .trim()}', is either not a valid typerpc type or a type alias that is not defined in this file`,
                        ),
              )

// Validates all methods of an rpc.QueryService
const validateService = (service: TypeAliasDeclaration): Error[] =>
    parseServiceMethods(service).flatMap((method) => [
        ...validateParams(method),
        ...validateReturnType(method),
        ...validateNotGeneric(method),
        ...validateMethodJsDoc(method),
        ...validateQueryMethodParams(method),
    ])

export const validateServices = (file: SourceFile): Error[] =>
    parseQueryServices(file).flatMap((type) => validateService(type))

export const serviceValidatorTesting = {
    validateService,
    validateNotGeneric,
    validateReturnType,
    validateMethodJsDoc,
    validateQueryMethodParams,
}
