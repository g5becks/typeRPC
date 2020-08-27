import {queryParamables} from '../../../src/schema/types'
import faker from 'faker'

export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

// typerpc comparable (dict keys)
const comparables = ['$.bool', '$.int8', '$.uint8', '$.uint16', '$.int16', '$.int32', '$.uint32', '$.int64', '$.uint64', '$.float32', '$.float64', '$.str', '$.timestamp', '$.err', '$.dyn']

// creates a random @typerpc rpc.Comparable
const genRandomComparable = () => comparables[randomNumber(0, comparables.length)]
// creates a random scalar type that can be used as an rpc.QuerySvc param

export const genRandomQueryParamableScalar = () => queryParamables[randomNumber(0, queryParamables.length)]

export const genRandomQueryParamableList = () => `$.List<${genRandomQueryParamableScalar()}>`

// a list of @typerpc/type => rpc.Container strings with rpc.Comparables
// as key type
const containers = [`$.Dict<${genRandomComparable()}, ${genRandomComparable()}>`, `$.List<${genRandomComparable()}>`, `$.Tuple2<${genRandomComparable()}, ${genRandomComparable()}>`, `$.Tuple3<${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`, `$.Tuple4<${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`, `$.Tuple5<${genRandomComparable()},${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`]

// returns a random @typerpc rpc.Container string that always has a scalar
const genRandomScalarContainer = (): string => containers[randomNumber(0, containers.length - 1)]

//
const paramables = [genRandomComparable, genRandomScalarContainer]

// returns a random rpc.Paramable DataType

const genRandomParamableType = (genMsgName: () => string) => {
  const funcs = [...paramables, genMsgName]
  return funcs[randomNumber(0, funcs.length)]()
}

const genDict = (genMsgName: () => string) => `$.Dict<${genRandomComparable()}, ${genRandomParamableType(genMsgName)}>`

const genList = (genMsgName: () => string) => `$.List<${genRandomParamableType(genMsgName)}>`

const genTuple2 = (genMsgName: () => string) => `$.Tuple2<${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}>`

const genTuple3 = (genMsgName: () => string) => `$.Tuple3<${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}>`

const genTuple4 = (genMsgName: () => string) => `$.Tuple4<${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}>`

const genTuple5 = (genMsgName: () => string) => `$.Tuple5<${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}, ${genRandomParamableType(genMsgName)}>`

// creates a random name for a Msg
export const genRandomName = (): string => {
  let name = faker.name.firstName().toUpperCase() + randomNumber(0, 200)
  if (name.includes('`')) {
    name = name.replace('`', '')
  }
  if (name.includes('\'')) {
    name = name.replace('\'', '')
  }
  return name
}

export const genRandomContainer = (genMsgName: () => string) => {
  const gen = [genDict, genList, genTuple2, genTuple3, genTuple4, genTuple5]
  return gen[randomNumber(0, gen.length)](genMsgName)
}

export const genRandomDataType = (genMsgName: () => string) => {
  const generated = [genRandomContainer(genMsgName), ...comparables, '$.nil', '$.unit']
  return generated[randomNumber(0, generated.length)]
}
