import {MethodSignature, ParameterDeclaration, SourceFile, TypeAliasDeclaration} from 'ts-morph'
import {
  HTTPErrCode,
  HTTPResponseCode,
  Method,
  MutationMethod,
  MutationService,
  Param,
  QueryMethod,
  QueryService,
} from '../schema'
import {makeDataType, useCbor} from './data-type'
import {parseJsDocComment, parseMutationServices, parseQueryServices, parseServiceMethods} from '../parser'
import {isErrCode, isResponseCode} from '../validator'
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

const hasCborParams = (params: ReadonlyArray<Param>, method: MethodSignature, isCborSvc: boolean): boolean =>  {
  return ([...params].some(param => is.Struct(param.type) && param.type.useCbor)) || isCborSvc || useCbor(method)
}

const buildMethod = (method: MethodSignature, isCborSvc: boolean, projectFiles: SourceFile[]): Method => {
  return {
    name: getMethodName(method),
    params: buildParams(method.getParameters(), projectFiles),
    returnType: makeDataType(method.getReturnTypeNodeOrThrow(), projectFiles),
    responseCode: buildResponseCode(method),
    errorCode: buildErrCode(method),
    httpMethod: 'GET',
    get isVoidReturn(): boolean {
      return make.unit === this.returnType
    },
    get hasCborReturn(): boolean {
      return (is.Struct(this.returnType) && this.returnType.useCbor) || isCborSvc || useCbor(method)
    },
    get hasParams(): boolean {
      return this.params.length > 0
    },
  }
}

const buildQueryMethod = (method: MethodSignature, isCborSvc: boolean, projectFiles: SourceFile[]): QueryMethod => {
  return {...buildMethod(method, isCborSvc, projectFiles),
    httpMethod: 'GET',
  }
}

const buildMutationMethod = (method: MethodSignature, isCborSvc: boolean, projectFiles: SourceFile[]): MutationMethod => {
  const builtMethod = buildMethod(method, isCborSvc, projectFiles)
  return {...builtMethod,
    httpMethod: 'POST',
    hasCborParams: hasCborParams(builtMethod.params, method, isCborSvc),
  }
}

const buildQueryMethods = (methods: MethodSignature[], isCborSvc: boolean, projectFiles: SourceFile[]): QueryMethod[] => [...new Set(methods.map(method => buildQueryMethod(method, isCborSvc, projectFiles)))]

const buildMutationMethods = (methods: MethodSignature[], isCborSvc: boolean, projectFiles: SourceFile[]): MutationMethod[] => [...new Set(methods.map(method => buildMutationMethod(method, isCborSvc, projectFiles)))]

const getServiceName = (service: TypeAliasDeclaration): string => service.getNameNode().getText().trim()

const buildQuerySvc = (service: TypeAliasDeclaration, projectFiles: SourceFile[]): QueryService => {
  const isCbor = useCbor(service)
  return {
    type: 'QueryService',
    name: getServiceName(service),
    methods: buildQueryMethods(parseServiceMethods(service), isCbor, projectFiles),
    useCbor: isCbor,
  }
}
const buildMutationSvc = (service: TypeAliasDeclaration, projectFiles: SourceFile[]): MutationService => {
  const isCbor = useCbor(service)
  return {
    type: 'MutationService',
    name: getServiceName(service),
    methods: buildMutationMethods(parseServiceMethods(service), isCbor, projectFiles),
    useCbor: isCbor,
  }
}
export const buildQueryServices = (file: SourceFile, projectFiles: SourceFile[]): QueryService[] => {
  const services = parseQueryServices(file)
  if (services.length === 0) {
    return []
  }
  return [...new Set(services.map(svc => buildQuerySvc(svc, projectFiles)))]
}

export const buildMutationServices = (file: SourceFile, projectFiles: SourceFile[]): MutationService[] => {
  const services = parseMutationServices(file)
  if (services.length === 0) {
    return []
  }
  return [...new Set(services.map(svc => buildMutationSvc(svc, projectFiles)))]
}

// TODO remove all the duplication at some point
