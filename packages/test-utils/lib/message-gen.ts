import {genRandomDataType, genRandomName, randomNumber} from './data-gen'
import {genImports, optional, useCbor} from './index'

export const genRpcMsgLiteral = (msgNames: string[]): string => {
  let props = ''
  const propCount = randomNumber(5, 12)
  for (let i = 0; i < propCount; i++) {
    props = props.concat(`prop${i}${optional()}: ${genRandomDataType(msgNames)};\n`)
  }
  return `rpc.Msg<{${props}}>`
}
const genRpcMsg = (name: string, msgNames: string[]): string => `
  ${useCbor()}
  type ${name} = ${genRpcMsgLiteral(msgNames)}
  `

export const genRpcMessages = (names: string[], msgNames: string[]): string => {
  let types = ''
  for (const name of names) {
    types = types.concat(genRpcMsg(name, msgNames))
  }
  return types
}

export const genMsgNames = (): string[] => {
  const num = randomNumber(30, 50)
  let names: string[] = []
  for (let i = 0; i < num; i++) {
    names = names.concat(genRandomName())
  }
  return [...new Set<string>(names)]
}

export const genTestMessageFiles = (msgNames: string[]): [string, string][] => {
  const count = randomNumber(1, 7)
  let i = 0
  let files: [string, string][] = []
  while (i < count) {
    const names = genMsgNames()
    const imports = genImports(msgNames)
    files = [...files, [`test${i}.ts`, imports.concat(genRpcMessages([...names], msgNames))]]
    i++
  }
  return files
}
