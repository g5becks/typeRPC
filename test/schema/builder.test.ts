import {internalTesting} from '../../src/schema/builder'
import {Project} from 'ts-morph'
import {containersList, primitivesMap} from '../../src/schema/types'

const {makeList,
  makeDict,
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
  makeTuple2,
  makeTuple3,
  makeTuple4,
  makeTuple5,
  stripQuestionMark} = internalTesting

let project: Project
beforeEach(() => {
  project = new Project()
})

test('isType function should return true when given the proper type', () => {
  const types = [...primitivesMap.keys(), ...containersList]
  let vars = ''
  for (const type of primitivesMap.keys()) {
    vars = vars.concat(`var ${type.replace('t.', '')}: ${type}\n`)
  }
  for (const type of containersList) {
    vars = vars.concat(`var ${type.replace('t.', '')}: ${type}\n`)
  }
  project.createSourceFile('test.ts', vars)
  const file = project.getSourceFile('test.ts')!
  file.getVariableDeclarations().forEach((variable, i) => {
    const res = isType(variable.getTypeNode()!, types[i])
    expect(res).toBeTruthy()
  })
})
