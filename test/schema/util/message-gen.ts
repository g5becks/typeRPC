import {genRandomDataType, genRandomName, randomNumber} from './data-gen'

const optional = () => randomNumber(0, 4) === 1 ? '?' : ''

export const useCbor = () => randomNumber(0, 5) === 1 ? `
  /**
 * @kind cbor
 */
 ` : ''

const genRpcMsgLiteral = (genMsgName: () => string): string => {
  let props = ''
  const propCount = randomNumber(5, 12)
  for (let i = 0; i < propCount; i++) {
    props = props.concat(`prop${i}${optional()}: ${genRandomDataType(genMsgName)};\n`)
  }
  return `rpc.Msg<{
      ${props}
      }\n`
}
const genRpcMsg = (name: string, genMsgName: () => string): string => `
  ${useCbor()}
  type ${name} = ${genRpcMsgLiteral(genMsgName)}
  `

export const genRpcMessages = (names: string[], genMsgName: () => string): string => {
  let types = ''
  for (const name of names) {
    types = types.concat(genRpcMsg(name, genMsgName))
  }
  return types
}

export const genTestMessageFiles = (genMsgName: () => string): [string, string][] => {
  const count = randomNumber(1, 7)
  let i = 0
  let files: [string, string][] = []
  while (i < count) {
    const names = genMsgNames()
    files = [...files, [`test${i}.ts`, genRpcMessages([...names], genMsgName)]]
    i++
  }
  return files
}

export const genMsgNames = (): Set<string> => {
  const num = randomNumber(30, 50)
  let names: string[] = []
  for (let i = 0; i < num; i++) {
    names = names.concat(genRandomName())
  }
  return new Set<string>(names)
}
