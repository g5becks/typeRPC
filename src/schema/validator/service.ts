import {HTTPErrCode, HTTPResponseCode} from '../schema'
import {MethodSignature, ParameterDeclaration, SourceFile, TypeAliasDeclaration} from 'ts-morph'
import {isHttpVerb, isValidDataType, singleValidationErr, validateNotGeneric} from './utils'
import {parseJsDocComment, parseServiceMethods, parseServices} from '../parser'
import {queryParamables} from '../types'

// Valid HTTP error codes
export const errCodes = [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 422, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]

// Valid HTTP success status codes
export const responseCodes = [200, 201, 202, 203, 204, 205, 206, 300, 301, 302, 303, 304, 305, 306, 307, 308]

// is the number used in the JsDoc @returns tag a valid typerpc HTTPResponseCode?
export const isResponseCode = (code: number | undefined): code is HTTPResponseCode => responseCodes.includes(code ?? 0)

// is the number used in the JsDoc @throws tag a valid typerpc HTTPErrCode?
export const isErrCode = (code: number | undefined): code is HTTPErrCode => errCodes.includes(code ?? 0)

// TODO test this function
const validateMethodJsDoc = (method: MethodSignature): Error[] => {
  const tags = method.getJsDocs()[0]?.getTags()
  if (typeof tags === 'undefined' || tags.length === 0) {
    return []
  }
  const validTags = ['throws', 'access', 'returns']
  const errs: Error[] = []
  for (const tag of tags) {
    const tagName = tag.getTagName()
    const comment = tag?.getComment()?.trim() ?? ''
    if (!validTags.includes(tag.getTagName())) {
      errs.push(singleValidationErr(tag, `${tag.getTagName()} is not a valid typerpc JsDoc tag. Valid tags are :${validTags}`))
    }
    if (tagName === 'access' && !isHttpVerb(comment)) {
      errs.push(singleValidationErr(tag, `${tag.getComment()} HTTP method is not supported by typerpc. Valids methods are 'POST' | 'GET'`))
    }
    if (tagName === 'throws') {
      const err = singleValidationErr(tag, `${comment} is not a valid HTTP error response code. Valid error response codes are : ${errCodes}`)
      try {
        if (!isErrCode(parseInt((comment)))) {
          errs.push(err)
        }
      } catch (error) {
        errs.push(err)
      }
    }
    if (tagName === 'returns') {
      const err = singleValidationErr(tag, `${tag.getComment()} is not a valid HTTP success response code. Valid success response codes are : ${responseCodes}`)
      try {
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

const validateGetMethodParam = (param: ParameterDeclaration): Error[] => {
  return queryParamables.some(val => param.getTypeNode()!.getText().trim().startsWith(val)) ?
    [singleValidationErr(param, `${param.getName()} has an invalid type. Methods annotated with @access GET are only allowed to use the following types for parameters: ${queryParamables}. Note: a t.List<> can only use one of the mentioned primitive types as a type parameter`)] : []
}

// TODO test this function
const validateGetRequestMethodParams = (method: MethodSignature): Error[] => {
  const params = method.getParameters()
  if (parseJsDocComment(method, 'access')?.toUpperCase() !== 'GET' || params.length === 0) {
    return []
  }
  return params.flatMap(param => validateGetMethodParam(param))
}

// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same file.
const validateReturnType = (method: MethodSignature, projectFiles: SourceFile[]): Error[] =>  isValidDataType(method.getReturnTypeNode(), projectFiles) ? [] : [singleValidationErr(method,
  `${method.getName()} has an invalid return type. All rpc.Service methods must return a valid typerpc type, an rpc.Msg literal, or an rpc.Msg defined in the same file. To return nothing, use 't.unit'`)]

// Ensure type of method params is either a typerpc type or a type
// declared in the same source file.
const validateParams = (method: MethodSignature, projectFiles: SourceFile[]): Error[] =>
  !method.getParameters() ? [] :
    method.getParameters().map(param => param.getTypeNode()).flatMap(type => isValidDataType(type, projectFiles) ? [] : singleValidationErr(type, `method parameter type '${type?.getText().trim()}', is either not a valid typerpc type or a type alias that is not defined in this file`))

// Validates all methods of an rpc.Service
const validateService = (service: TypeAliasDeclaration, projectFiles: SourceFile[]): Error[] => parseServiceMethods(service).flatMap(method => [...validateParams(method, projectFiles), ...validateReturnType(method, projectFiles), ...validateNotGeneric(method), ...validateMethodJsDoc(method), ...validateGetRequestMethodParams(method)])

export const validateServices = (file: SourceFile, projectFiles: SourceFile[]): Error[] => parseServices(file).flatMap(type => validateService(type, projectFiles))
