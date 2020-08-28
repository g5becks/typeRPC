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

export const genRandomQueryParamableScalar = () => queryParamables.filter(val => val !== '$.List')[randomNumber(0, queryParamables.length - 1)]

export const genRandomQueryParamableList = () => `$.List<${genRandomQueryParamableScalar()}>`

// a list of @typerpc/type => rpc.Container strings with rpc.Comparables
// as key type
const containers = [`$.Dict<${genRandomComparable()}, ${genRandomComparable()}>`, `$.List<${genRandomComparable()}>`, `$.Tuple2<${genRandomComparable()}, ${genRandomComparable()}>`, `$.Tuple3<${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`, `$.Tuple4<${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`, `$.Tuple5<${genRandomComparable()},${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`]

// returns a random @typerpc rpc.Container string that always has a scalar
const genRandomScalarContainer = (): string => containers[randomNumber(0, containers.length - 1)]

//
const paramables = [genRandomComparable, genRandomScalarContainer]

// returns a random rpc.Paramable DataType
// THIS FUNCTION AND EVERY FUNCTION THAT CALLS IS TAKES A msgNames PARAM
// BECAUSE THE SCHEMA VALIDATOR WILL THROW AN ERROR IF IT FINDS A TYPE THAT
// IS USED AND NOT DEFINED IN THE SAME FILE OR IMPORTED IN THE FILE, SO
// THE NAMES OF THE MESSAGES TO GENERATE NEED TO BE KNOWN BEFOREHAND
const genRandomParamableType = (msgNames: string[]) => {
  const funcs = [...paramables, () => msgNames[randomNumber(0, msgNames.length)]]
  return funcs[randomNumber(0, funcs.length)]()
}

const genDict = (msgNames: string[]) => `$.Dict<${genRandomComparable()}, ${genRandomParamableType(msgNames)}>`

const genList = (msgNames: string[]) => `$.List<${genRandomParamableType(msgNames)}>`

const genTuple2 = (msgNames: string[]) => `$.Tuple2<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`

const genTuple3 = (msgNames: string[]) => `$.Tuple3<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`

const genTuple4 = (msgNames: string[]) => `$.Tuple4<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`

const genTuple5 = (msgNames: string[]) => `$.Tuple5<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`

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

export const genRandomContainer = (msgNames: string[]) => {
  const gen = [genDict, genList, genTuple2, genTuple3, genTuple4, genTuple5]
  return gen[randomNumber(0, gen.length)](msgNames)
}

export const genRandomDataType = (msgNames: string[]) => {
  const generated = [genRandomContainer(msgNames), ...comparables, '$.nil', '$.unit']
  return generated[randomNumber(0, generated.length)]
}
