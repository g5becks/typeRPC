// generate a random param type to use when generating an rpc.QuerySvc
import {
  genRandomDataType,
  genRandomName,
  genRandomQueryParamableList,
  genRandomQueryParamableScalar,
  randomNumber,
} from './data-gen'
import {genRpcMsgLiteral} from './message-gen'
import {optional, useCbor} from '.'

const genQuerySvcParamType = () => {
  const generated = [genRandomQueryParamableScalar(), genRandomQueryParamableList()]
  return generated[randomNumber(0, generated.length)]
}

const genMutationSvcParamType = (genMsgName: () => string) => {
  const generated = [genRandomDataType(genMsgName), genRpcMsgLiteral(genMsgName), genRandomDataType(genMsgName), genRandomDataType(genMsgName)]
  return generated[randomNumber(0, generated.length)]
}
// gen a method param
const genParam = (type: SvcType, isOptional: boolean, genMsgName: () => string): string => {
  const param = genRandomName() + `${isOptional ? '?' : ''}:`
  return type === 'Query' ? `${param} ${genQuerySvcParamType()}` : `${param} ${genMutationSvcParamType(genMsgName)}`
}

const genReturnType = (genMsgName: () => string): string => {
  const generated = [genRandomDataType(genMsgName), genRandomDataType(genMsgName), genMsgName(), genRandomDataType(genMsgName), genRpcMsgLiteral(genMsgName)]
  return generated[randomNumber(0, generated.length)]
}

type SvcType = 'Query' | 'Mutation'
// gen a method for an rpc.Service

const genMethod = (type: SvcType, genMsgName: () => string): string => {
  const paramsCount = randomNumber(0, 6)
  let params = ''
  for (let i = 0; i < paramsCount; i++) {
    if (i < 3) {
      params = params.concat(`${genParam(type, false, genMsgName)},`)
    } else {
      const useComma = i !== paramsCount - 1 ? ', ' : ''
      params = params.concat(`${genParam(type, true, genMsgName)}${useComma}`)
    }
  }
  return `

  ${genRandomName().toLowerCase()}(${params}): ${genReturnType(genMsgName)};`
}

const genQueryService = (genMsgName: () => string, cbor: boolean): string => {
  const methodCount = randomNumber(5, 12)
  let methods = ''
  for (let i = 0; i < methodCount; i++) {
    methods = methods.concat(genMethod('Query', genMsgName) + '\n\n')
  }
  return `
  ${cbor ? useCbor() : ''}
  type ${genRandomName().toLowerCase()} = rpc.QuerySvc<{
    ${methods}
  }>\n`
}

export const genServices = (typeMaker: () => string): string => {
  const num = randomNumber(5, 12)
  let services = ''
  for (let i = 0; i < num; i++) {
    services = services.concat(genQueryService(typeMaker))
  }
  return services
}
