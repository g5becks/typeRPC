import {containers, is, scalars, testing} from '../../../src/schema'
import {Project, TypeAliasDeclaration} from 'ts-morph'
import {genSourceFile, genSourceFiles, genTestMessageFiles, makeStructTestSource, genMsgNames} from '../util'
import 'array-flat-polyfill'

const {
  isType,
  useCbor,
  makeDataType,
  parseMsgProps,
} = testing

let project: Project
beforeEach(() => {
  project = new Project()
})

test('isType() should return true when given the proper type', () => {
  let vars = ''
  const types = [...scalars, ...containers]
  for (const type of scalars) {
    vars = vars.concat(`var ${type.replace('$.', '')}: ${type}\n`)
  }
  for (const type of containers) {
    vars = vars.concat(`var ${type.replace('$.', '')}: ${type}\n`)
  }
  genSourceFile(vars, project).getVariableDeclarations().forEach((variable, i) =>
    expect(isType(variable.getTypeNode()!, types[i])).toBeTruthy())
})

test('makeDataType() should return correct DataType for type prop', () => {
  const sources = genSourceFiles(genTestMessageFiles(genMsgNames()), project)
  const types: TypeAliasDeclaration[] = sources.flatMap(source => source.getTypeAliases())
  const propTypes = types.flatMap(type => parseMsgProps(type)).flatMap(prop => prop.getTypeNodeOrThrow())
  for (const type of propTypes) {
    expect(is.DataType(makeDataType(type))).toBeTruthy()
  }
})

test('useCbor() should return the correct boolean value based on JsDoc tag', () => {
  const file = genSourceFile(makeStructTestSource, project)
  const cbor1 = file.getTypeAlias('CborType')
  const cbor2 = file.getTypeAlias('AnotherCbor')
  const noCbor1 = file.getTypeAlias('NoCbor')
  const noCbor2 = file.getTypeAlias('MoreNoCbor')

  expect(useCbor(cbor1)).toBeTruthy()
  expect(useCbor(cbor2)).toBeTruthy()
  expect(useCbor(noCbor1)).toBeFalsy()
  expect(useCbor(noCbor2)).toBeFalsy()
})
