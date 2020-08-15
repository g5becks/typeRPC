import {internalTesting} from '../../src/schema/builder'
import {Project, SourceFile} from 'ts-morph'
import {containersList, primitivesMap} from '../../src/schema/types'
import * as faker from 'faker'
const {
  isType,
  isCbor,
  isContainer,
  buildSchema,
  buildInterface,
  buildInterfaces,
  buildMethod,
  buildMethods,
  getMethodName,
  getInterfaceName,
  buildParams,
  buildProps,
  buildTypes,
  buildHttpVerb,
  isOptional,
  makeDataType,
  stripQuestionMark,
} = internalTesting

let project: Project
beforeEach(() => {
  project = new Project()
})

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

const makePrimitiveType = () => {
  const prims = [...primitivesMap.keys()]
  return prims[randomNumber(0, prims.length - 1)]
}
const makeRandomVars = (count: number): string => {
  let vars = ''
  for (let i = 0; i < count; i++) {
    vars = vars.concat(`var testVar${count}: ${makePrimitiveType()}`)
  }
  return vars
}
const comparables = ['t.bool', 't.int8', 't.uint8', 't.uint16', 't.int16', 't.int32', 't.uint32', 't.int64', 't.uint64', 't.float32', 't.float64', 't.str', 't.timestamp', 't.err', 't.dyn']

const randomComparable = () => comparables[randomNumber(0, comparables.length - 1)]
const randomContainer = (): string => {
  const containers = [`t.Dict<${randomComparable()}, ${randomComparable()}>`, `t.List<${randomComparable()}>`, `t.Tuple2<${randomComparable()}, ${randomComparable()}>`, `t.Tuple3<${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `t.Tuple4<${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `t.Tuple5<${randomComparable()},${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`]
  return containers[randomNumber(0, containers.length - 1)]
}

const randomStructName =  (): string => faker.name.firstName().toUpperCase()
const randomKeyable = () => {
  const keyables = [randomComparable(), randomContainer(), randomStructName()]
  return keyables[randomNumber(0, keyables.length - 1)]
}
const makeDict = () => `t.Dict<${randomComparable()}, ${randomKeyable()}>`

const makeList = () => `t.List<${randomKeyable()}>`

const makeTuple2 = () => `t.Tuple2<${randomKeyable()}, ${randomKeyable()}>`

const makeTuple3 = () => `t.Tuple3<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeTuple4 = () => `t.Tuple4<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeTuple5 = () => `t.Tuple5<${randomKeyable()},${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeRandomDataType = (): string => {
  const makers = [randomStructName, makeDict, makeList, makeTuple2, makeTuple3, makeTuple4, makeTuple5, randomComparable, () => 't.unit', () => 't.nil']
  return makers[randomNumber(0, makers.length - 1)]()
}

const makeRandomType = (propCount: number): string => {
  let props = ''
  for (let i = 0; i < propCount; i++) {
    props = props.concat(`prop${propCount}: ${makeRandomDataType()};\n`)
  }
  return `type TestType = {
    ${props}
  }`
}

const getSourceFile = (source: string, project: Project): SourceFile => {
  project.createSourceFile('test.ts', source)
  return project.getSourceFile('test.ts')!
}
test('isType() should return true when given the proper type', () => {
  let vars = ''
  const types = [...primitivesMap.keys(), ...containersList]
  for (const type of primitivesMap.keys()) {
    vars = vars.concat(`var ${type.replace('t.', '')}: ${type}\n`)
  }
  for (const type of containersList) {
    vars = vars.concat(`var ${type.replace('t.', '')}: ${type}\n`)
  }
  getSourceFile(vars, project).getVariableDeclarations().forEach((variable, i) =>
    expect(isType(variable.getTypeNode()!, types[i])).toBeTruthy())
})

test('makeRandomType() should return type with correct number of props', () => {
  const propsLen = randomNumber(0, 100)
  const type = makeRandomType(propsLen)
  const file = getSourceFile(type, project)
  const alias = file.getTypeAliases()[0]
  const propsLength = alias.getTypeNode()!.forEachChildAsArray().length
  expect(propsLength).toEqual(propsLen)
})

test('makeDataType() should return correct DataType for type prop', () => {
  const type = makeRandomType(randomNumber(140, 300))
  const file = getSourceFile(type, project)
  const types = file.getTypeAliases()[0].getTypeNode()!.forEachChildAsArray()
})
