import {Project, SourceFile} from 'ts-morph'
import * as faker from 'faker'
import {queryParamables} from '../../src/schema'

export const validImport = 'import {$, rpc} from \'@typerpc/types\''
export const validQuerySvc = `
type TestService = rpc.QuerySvc<{
    getNames(name: $.str): $.bool
  }>
  `

export const testQuerySvc = `
type TestQuerySvc = rpc.QuerySvc<{
  /**
   * @throws 404
   * @returns 200
   */
  getSomethingById(id: number): string;

  /**
   * @throws 500
   * @returns 202
   */
  addSomething(something: any): any;

  /**
   * @throws 401
   * @returns 201
   */
  addSomethingElse(something: any): any;

  /**
   * @throws 400
   * @returns 204
   */
  deleteSomething(something: any): any;

  /**
   * @throws 403
   * @returns 301
   */
  preRequest(): boolean;

  /**
   * @access OPTIONS
   */
  getOpts(): string[];

  /**
   * @access PATCH
   */
  updateSomething(something: any): string;
}`

export const sourceWithValidImportAndInterface = (source: string) => `
${validImport}
${source}
${validQuerySvc}
`
export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

// list of type strings that adhere to @typerpc/messages => rpc.Comparable type
const comparables = ['$.bool', '$.int8', '$.uint8', '$.uint16', '$.int16', '$.int32', '$.uint32', '$.int64', '$.uint64', '$.float32', '$.float64', '$.str', '$.timestamp', '$.err', '$.dyn']

// creates a random @typerpc/messages => rpc.Comparable
const randomComparable = () => comparables[randomNumber(0, comparables.length)]

const randomQueryParamable = () => queryParamables[randomNumber(0, queryParamables.length)]

const randomQueryParamableList = () => `$.List<${randomQueryParamable()}>`

// a list of @typerpc/type => rpc.Container strings with rpc.Comparables
// as key type
const containers = [`$.Dict<${randomComparable()}, ${randomComparable()}>`, `$.List<${randomComparable()}>`, `$.Tuple2<${randomComparable()}, ${randomComparable()}>`, `$.Tuple3<${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `$.Tuple4<${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `$.Tuple5<${randomComparable()},${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`]

// returns a random @typerpc/messages => rpc.Container string
const randomContainer = (): string => containers[randomNumber(0, containers.length - 1)]

// creates a random name for a struct
const randomStructName =  (): string => {
  let name = faker.name.firstName().toUpperCase() + randomNumber(0, 200)
  if (name.includes('`')) {
    name = name.replace('`', '')
  }
  if (name.includes('\'')) {
    name = name.replace('\'', '')
  }
  return name
}

// list of messages that can be used as a container dataType
const keyables = [randomComparable, randomContainer]

// returns a random dataType for a container
const randomKeyable = (makeStruct: () => string) => {
  const funcs = [...keyables, makeStruct]
  return funcs[randomNumber(0, funcs.length)]()
}

const makeDict = (makeStruct: () => string) => `$.Dict<${randomComparable()}, ${randomKeyable(makeStruct)}>`

const makeList = (makeStruct: () => string) => `$.List<${randomKeyable(makeStruct)}>`

const makeTuple2 = (makeStruct: () => string) => `$.Tuple2<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

const makeTuple3 = (makeStruct: () => string) => `$.Tuple3<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

const makeTuple4 = (makeStruct: () => string) => `$.Tuple4<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

const makeTuple5 = (makeStruct: () => string) => `$.Tuple5<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

// make a method param
const makeParam = (typeMaker: () => string): string => `${randomStructName().toLowerCase()}: ${typeMaker()}`
// make optional method param
const makeOptionalParam = (typeMaker: () => string): string => `${randomStructName().toLowerCase()}?: ${typeMaker()}`

// make a method for an rpc.Service
const makeMethod = (typeMaker: () => string): string => {
  const paramsCount = randomNumber(0, 6)
  let params = ''
  for (let i = 0; i <  paramsCount; i++) {
    if (i < 3) {
      params = params.concat(`${makeParam(typeMaker)},`)
    } else {
      const useComma = i !== paramsCount - 1 ? ', ' : ''
      params = params.concat(`${makeOptionalParam(typeMaker)}${useComma}`)
    }
  }
  return `${randomStructName().toLowerCase()}(${params}): ${typeMaker()};`
}

const makeQueryService = (typeMaker: () => string): string => {
  const methodCount = randomNumber(5, 12)
  let methods = ''
  for (let i = 0; i < methodCount; i++) {
    methods = methods.concat(makeMethod(typeMaker) + '\n\n')
  }
  return `
  type ${randomStructName().toLowerCase()} = rpc.QuerySvc<{
    ${methods}
  }>\n`
}

const makeServices = (typeMaker: () => string): string => {
  const num = randomNumber(5, 12)
  let services = ''
  for (let i = 0; i < num; i++) {
    services = services.concat(makeQueryService(typeMaker))
  }
  return services
}

const optional = () => randomNumber(0, 2) === 0 ? '' : '?'

const useCbor = () => {
  const cbor = `
  /**
 * cbor
 */
 `
  const choices = ['', '', cbor]
  return choices[randomNumber(0, 3)]
}

const makeRpcMsg = (name: string, typeMaker: () => string): string => {
  let props = ''
  const propCount = randomNumber(5, 22)
  for (let i = 0; i < propCount; i++) {
    props = props.concat(`prop${i}${optional()}: ${typeMaker()};\n`)
  }
  return `
  ${useCbor()}
  type ${name} = rpc.Msg<{
    ${props}
  }>\n`
}

const makeRpcMessages = (names: string[], typeMaker: () => string): string => {
  let types = ''
  for (const name of names) {
    types = types.concat(makeRpcMsg(name, typeMaker))
  }
  return types
}

export const getSourceFile = (source: string, project: Project): SourceFile =>
  project.createSourceFile('tes$.ts', source)

const makeMsgNames = (): Set<string> => {
  const num = randomNumber(30, 50)
  let names: string[] = []
  for (let i = 0; i < num; i++) {
    names = names.concat(randomStructName())
  }
  return new Set<string>(names)
}
export const makeTestFile = (project: Project, fileName = 'tes$.ts'): SourceFile => {
  const typeNames: string[] = [...makeMsgNames()]
  const randomStruct = () => typeNames[randomNumber(0, typeNames.length)]
  const makers = [makeDict, makeList, makeTuple2, makeTuple3, makeTuple4, makeTuple5, randomComparable, () => '$.unit', () => '$.nil']
  const queryParamableMakers = [randomQueryParamable, randomQueryParamableList]
  const typeMaker = () => makers[randomNumber(0, makers.length)](randomStruct)
  const queryParamableMaker = () => queryParamableMakers[randomNumber(0, queryParamableMakers.length)]()
  const queryServices = makeServices(queryParamableMaker)
  const mutationServices = makeServices(typeMaker)
  const types = makeRpcMessages(typeNames, typeMaker)
  return project.createSourceFile(fileName, types.concat(queryServices).concat(mutationServices))
}

export const makeTestFiles = (project: Project): SourceFile[] => {
  const fileCount = randomNumber(12, 35)
  let files: SourceFile[] =  []
  for (let i = 0; i < fileCount; i++) {
    const fileName = randomStructName().toLowerCase() + i.toString() + '.ts'
    files = files.concat(makeTestFile(project, fileName))
  }
  return files
}

export const makeStructTestSource = `
  /** @kind cbor */
type CborType = {}

/** @kind cbor */

type AnotherCbor = {}
type TestType1 = {
  prop1: CborType;
  prop2: AnotherCbor;
}

/**
*
*/
type NoCbor = {}

type MoreNoCbor = {}

type TestType2 = {
  prop1: NoCbor;
  prop2: MoreNoCbor;
}
`
export const methodSchemaTestSource = makeStructTestSource.concat(`
\n
interface MethodsTest {
  method1(cborParam: CborType, param2: NoBor): NoCbor;
  method2(): AnotherCbor
  method3(param: TestType2): NoCbor;
  method4(): $.unit;
}
`)

export const schemaWithoutCbor = makeStructTestSource.concat(`
\n
interface NoCborInterface {
  method1(): NoCbor;
  method2(n: NoCbor): string;
}`)

export const schemaWithCbor = makeStructTestSource.concat(`
\n
interface CborInterface {
  method1(): CborType;
  method2(n: NoCbor): string;
  method3(y: AnotherCbor): TestType2;
  }`)

export type testProp = {
    isOptional: boolean;
    name: string;
    type: string;
  }
