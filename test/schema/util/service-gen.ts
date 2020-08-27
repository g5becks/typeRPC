// generate a random param type to use when generating an rpc.QuerySvc
import {
  genRandomDataType,
  genRandomName,
  genRandomQueryParamableList,
  genRandomQueryParamableScalar,
  randomNumber
} from './data-gen'

const genQuerySvcParamType = () => {
  const typeMakers = [genRandomQueryParamableScalar, genRandomQueryParamableList]
  return typeMakers[randomNumber(0, typeMakers.length)]()
}

// gen a method param
const genParam = (type: SvcType, isOptional: boolean, genMsgName: () => string): string => {
  const param = genRandomName() + `${isOptional ? '?' : ''}:`
  return type === 'Query' ? `${param} ${genQuerySvcParamType()}` : `${param} ${}`
}

const genReturnType = (genMsgName: () => string) => {
  const generated = [genRandomDataType(genMsgName), genRandomDataType(genMsgName), genMsgName(), genRandomDataType(genMsgName)]}

type SvcType = 'Query' | 'Mutation'
// gen a method for an rpc.Service
const genMethod = (type: SvcType, genMsgName: () => string): string => {
  const paramsCount = randomNumber(0, 6)
  let params = ''
  for (let i = 0; i < paramsCount; i++) {
    if (i < 3) {
      params = params.concat(`${genParam(genMsgName)},`)
    } else {
      const useComma = i !== paramsCount - 1 ? ', ' : ''
      params = params.concat(`${genOptionalParam(genMsgName)}${useComma}`)
    }
  }
  return `${genRandomMsgName().toLowerCase()}(${params}): ${genReturnType(genMsgName)};`
}
const genQueryService = (typeMaker: () => string): string => {
  const methodCount = randomNumber(5, 12)
  let methods = ''
  for (let i = 0; i < methodCount; i++) {
    methods = methods.concat(genMethod(typeMaker) + '\n\n')
  }
  return `
  type ${genRandomMsgName().toLowerCase()} = rpc.QuerySvc<{
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
