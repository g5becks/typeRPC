import {MethodSignature, ParameterDeclaration, SourceFile, TypeAliasDeclaration} from 'ts-morph'
import {HTTPErrCode, HTTPResponseCode, MutationMethod, Param, QueryService} from '../schema'
import {makeDataType, useCbor} from './data-type'
import {parseJsDocComment, parseServiceMethods, parseQueryServices} from '../parser'
import {isErrCode, isHttpVerb, isResponseCode} from '../validator'
import {is, make} from '../types'

// builds the HTTPResponseCode for a Method Schema using the parsed JsDoc
export const buildResponseCode = (method: MethodSignature): HTTPResponseCode => {
  const comment = parseJsDocComment(method, 'returns') ?? '200'
  const response = parseInt(comment)
  return isResponseCode(response) ? response as HTTPResponseCode : 200
}

// builds the HTTPErrCode for a Method Schema using the parsed JsDoc
export const buildErrCode = (method: MethodSignature): HTTPErrCode => {
  const comment = parseJsDocComment(method, 'throws') ?? '500'
  const response = parseInt(comment)
  return isErrCode(response) ? response as HTTPErrCode : 500
}

// builds all Schema Param for a method
export const buildParams = (params: ParameterDeclaration[], projectFiles: SourceFile[]): Param[] => {
  return [...new Set<Param>(params.map(param => {
    return {
      name: param.getName().trim(),
      isOptional: param.isOptional(),
      type: makeDataType(param.getTypeNodeOrThrow(), projectFiles),
    }
  }))]
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

export const buildMethod = (method: MethodSignature, isCborService: boolean, projectFiles: SourceFile[]): MutationMethod => {
  return {
    name: getMethodName(method),
    params: buildParams(method.getParameters(), projectFiles),
    returnType: makeDataType(method.getReturnTypeNodeOrThrow(), projectFiles),
    responseCode: buildResponseCode(method),
    errorCode: buildErrCode(method),
    get isVoidReturn(): boolean {
      // noinspection JSDeepBugsBinOperand
      return this.returnType === make.unit
    },
    get hasCborParams(): boolean {
      return ([...this.params].some(param => is.Struct(param.type) && param.type.useCbor)) || isCborService || useCbor(method)
    },
    get hasCborReturn(): boolean {
      return (is.Struct(this.returnType) && this.returnType.useCbor) || isCborService || useCbor(method)
    },
    get hasParams(): boolean {
      return this.params.length > 0
    },
  }
}

const buildMethods = (methods: MethodSignature[], serviceIsCbor: boolean, projectFiles: SourceFile[]): MutationMethod[] => [...new Set(methods.map(method => buildMethod(method, serviceIsCbor, projectFiles)))]

const getServiceName = (service: TypeAliasDeclaration): string => service.getNameNode().getText().trim()

const buildService = (service: TypeAliasDeclaration, projectFiles: SourceFile[]): QueryService => {
  const isCbor = useCbor(service)
  return {
    name: getServiceName(service),
    methods: buildMethods(parseServiceMethods(service), isCbor, projectFiles),
    useCbor: isCbor,
  }
}
export const buildServices = (file: SourceFile, projectFiles: SourceFile[]): QueryService[] => {
  const services = parseQueryServices(file)
  if (services.length === 0) {
    return []
  }
  return [...new Set(services.map(srvc => buildService(srvc, projectFiles)))]
}
