/* eslint-disable radix */
import { MethodSignature, ParameterDeclaration, SourceFile, TypeAliasDeclaration } from 'ts-morph'
import {
    HTTPErrCode,
    HTTPResponseCode,
    Method,
    MutationMethod,
    MutationService,
    Param,
    QueryMethod,
    QueryService,
} from '../../schema/src/schema'
import { makeDataType, useCbor } from './data-type'
import { parseJsDocComment, parseMutationServices, parseQueryServices, parseServiceMethods } from '@typerpc/parser'
import { isErrCode, isResponseCode } from '@typerpc/validators'
import { is, make } from '@typerpc/schema'

// builds the HTTPResponseCode for a Method Schema using the parsed JsDoc
export const buildResponseCode = (method: MethodSignature): HTTPResponseCode => {
    const comment = parseJsDocComment(method, 'returns') ?? '200'
    const response = parseInt(comment)
    return isResponseCode(response) ? (response as HTTPResponseCode) : 200
}

// builds the HTTPErrCode for a Method Schema using the parsed JsDoc
export const buildErrCode = (method: MethodSignature): HTTPErrCode => {
    const comment = parseJsDocComment(method, 'throws') ?? '500'
    const response = parseInt(comment)
    return isErrCode(response) ? (response as HTTPErrCode) : 500
}

// builds all Schema Param for a method
export const buildParams = (params: ParameterDeclaration[]): Param[] => {
    return [
        ...new Set<Param>(
            params.map((param) => {
                return {
                    name: param.getName().trim(),
                    isOptional: param.isOptional(),
                    type: makeDataType(param.getTypeNodeOrThrow()),
                }
            }),
        ),
    ]
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

export const hasCborParams = (params: ReadonlyArray<Param>, method: MethodSignature, isCborSvc: boolean): boolean => {
    return [...params].some((param) => is.struct(param.type) && param.type.useCbor) || isCborSvc || useCbor(method)
}

export const buildMethod = (method: MethodSignature, isCborSvc: boolean): Method => {
    return {
        name: getMethodName(method),
        params: buildParams(method.getParameters()),
        returnType: makeDataType(method.getReturnTypeNodeOrThrow()),
        responseCode: buildResponseCode(method),
        errorCode: buildErrCode(method),
        httpMethod: 'GET',
        get isVoidReturn(): boolean {
            return make.unit === this.returnType
        },
        get hasCborReturn(): boolean {
            return (is.struct(this.returnType) && this.returnType.useCbor) || isCborSvc || useCbor(method)
        },
        get hasParams(): boolean {
            return this.params.length > 0
        },
    }
}

export const buildQueryMethod = (method: MethodSignature, isCborSvc: boolean): QueryMethod => {
    return { ...buildMethod(method, isCborSvc), httpMethod: 'GET' }
}

export const buildMutationMethod = (method: MethodSignature, isCborSvc: boolean): MutationMethod => {
    const builtMethod = buildMethod(method, isCborSvc)
    return { ...builtMethod, httpMethod: 'POST', hasCborParams: hasCborParams(builtMethod.params, method, isCborSvc) }
}

const buildQueryMethods = (methods: MethodSignature[], isCborSvc: boolean): QueryMethod[] => [
    ...new Set(methods.map((method) => buildQueryMethod(method, isCborSvc))),
]

const buildMutationMethods = (methods: MethodSignature[], isCborSvc: boolean): MutationMethod[] => [
    ...new Set(methods.map((method) => buildMutationMethod(method, isCborSvc))),
]

const getServiceName = (service: TypeAliasDeclaration): string => service.getNameNode().getText().trim()

const buildQuerySvc = (service: TypeAliasDeclaration): QueryService => {
    const isCbor = useCbor(service)
    return {
        type: 'QueryService',
        name: getServiceName(service),
        methods: buildQueryMethods(parseServiceMethods(service), isCbor),
        useCbor: isCbor,
    }
}
const buildMutationSvc = (service: TypeAliasDeclaration): MutationService => {
    const isCbor = useCbor(service)
    return {
        type: 'MutationService',
        name: getServiceName(service),
        methods: buildMutationMethods(parseServiceMethods(service), isCbor),
        useCbor: isCbor,
    }
}
export const buildQueryServices = (file: SourceFile): QueryService[] => {
    const services = parseQueryServices(file)
    if (services.length === 0) {
        return []
    }
    return [...new Set(services.map((svc) => buildQuerySvc(svc)))]
}

export const buildMutationServices = (file: SourceFile): MutationService[] => {
    const services = parseMutationServices(file)
    if (services.length === 0) {
        return []
    }
    return [...new Set(services.map((svc) => buildMutationSvc(svc)))]
}

// TODO remove all the duplication at some point
