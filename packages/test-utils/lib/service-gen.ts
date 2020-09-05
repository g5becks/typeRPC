// generate a random param type to use when generating an rpc.QuerySvc
import {
    genRandomDataType,
    genRandomName,
    genRandomQueryParamableList,
    genRandomQueryParamableScalar,
    randomNumber,
} from './data-gen'
import { genRpcMsgLiteral } from './message-gen'
import { genImports, useCbor } from './index'

const genQuerySvcParamType = () => {
    const generated = [genRandomQueryParamableScalar(), genRandomQueryParamableList()]
    return generated[randomNumber(0, generated.length)]
}

const genMutationSvcParamType = (msgNames: string[]) => {
    const generated = [
        genRandomDataType(msgNames),
        genRpcMsgLiteral(msgNames),
        genRandomDataType(msgNames),
        genRandomDataType(msgNames),
    ]
    return generated[randomNumber(0, generated.length)]
}
// gen a method param
const genParam = (type: SvcType, isOptional: boolean, msgNames: string[]): string => {
    const param = genRandomName() + `${isOptional ? '?' : ''}:`
    return type === 'Query' ? `${param} ${genQuerySvcParamType()}` : `${param} ${genMutationSvcParamType(msgNames)}`
}

const genReturnType = (msgNames: string[]): string => {
    const generated = [
        genRandomDataType(msgNames),
        genRandomDataType(msgNames),
        genRandomDataType(msgNames),
        genRpcMsgLiteral(msgNames),
    ]
    return generated[randomNumber(0, generated.length)]
}

type SvcType = 'Query' | 'Mutation'
// gen a method for an rpc.Service

const genMethod = (type: SvcType, msgNames: string[]): string => {
    const paramsCount = randomNumber(0, 6)
    let params = ''
    for (let i = 0; i < paramsCount; i++) {
        const useComma = i === paramsCount - 1 ? '' : ', '
        if (i < 3) {
            params = params.concat(`${genParam(type, false, msgNames)}${useComma}`)
        } else {
            params = params.concat(`${genParam(type, true, msgNames)}${useComma}`)
        }
    }
    return `

  ${genRandomName().toLowerCase()}(${params}): ${genReturnType(msgNames)};`
}

const genSvc = (type: SvcType, msgNames: string[], cbor: boolean): string => {
    const methodCount = randomNumber(5, 12)
    let methods = ''
    for (let i = 0; i < methodCount; i++) {
        methods = methods.concat(genMethod(type, msgNames) + '\n\n')
    }
    return `
  ${cbor ? useCbor() : ''}
  type ${genRandomName().toLowerCase()} = rpc.${type}Svc<{
    ${methods}
  }>\n`
}

export const genServices = (type: SvcType, msgNames: string[]): string => {
    const num = randomNumber(5, 12)
    let services = ''
    for (let i = 0; i < num; i++) {
        services = services.concat(genSvc(type, msgNames, false))
    }
    return genImports(msgNames).concat(services)
}
