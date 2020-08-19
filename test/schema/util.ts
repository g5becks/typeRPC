import {Project, SourceFile} from 'ts-morph'
import * as faker from 'faker'

export const validImport = 'import {t} from \'@typerpc/types\''
export const validInterface = `
  interface Test {
    getNames(name: t.str): t.bool
  }
  `

export const testController = `
  interface TestController {
  /**
   * GET
   */
  getSomethingById(id: number): string;

  /**
   * POST
   */
  addSomething(something: any): any;

  /**
   * PUT
   */
  addSomethingElse(something: any): any;

  /**
   * DELETE
   */
  deleteSomething(something: any): any;

  /**
   * HEAD
   */
  preRequest(): boolean;

  /**
   * OPTIONS
   */
  getOpts(): string[];

  /**
   * PATCH
   */
  updateSomething(something: any): string;
}`

export const sourceWithValidImportAndInterface = (source: string) => `
${validImport}
${source}
${validInterface}
`
export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

// list of type strings that adhere to @typerpc/types => rpc.Comparable type
const comparables = ['t.bool', 't.int8', 't.uint8', 't.uint16', 't.int16', 't.int32', 't.uint32', 't.int64', 't.uint64', 't.float32', 't.float64', 't.str', 't.timestamp', 't.err', 't.dyn']

// creates a random @typerpc/types => rpc.Comparable
const randomComparable = () => comparables[randomNumber(0, comparables.length - 1)]

// a list of @typerpc/type => rpc.Container strings with rpc.Comparables
// as key type
const containers = [`t.Dict<${randomComparable()}, ${randomComparable()}>`, `t.List<${randomComparable()}>`, `t.Tuple2<${randomComparable()}, ${randomComparable()}>`, `t.Tuple3<${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `t.Tuple4<${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `t.Tuple5<${randomComparable()},${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`]

// returns a random @typerpc/types => rpc.Container string
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

// list of types that can be used as a container dataType
const keyables = [randomComparable, randomContainer]

// returns a random dataType for a container
const randomKeyable = (makeStruct: () => string) => {
  const funcs = [...keyables, makeStruct]
  return funcs[randomNumber(0, funcs.length)]()
}

const makeDict = (makeStruct: () => string) => `t.Dict<${randomComparable()}, ${randomKeyable(makeStruct)}>`

const makeList = (makeStruct: () => string) => `t.List<${randomKeyable(makeStruct)}>`

const makeTuple2 = (makeStruct: () => string) => `t.Tuple2<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

const makeTuple3 = (makeStruct: () => string) => `t.Tuple3<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

const makeTuple4 = (makeStruct: () => string) => `t.Tuple4<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

const makeTuple5 = (makeStruct: () => string) => `t.Tuple5<${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}, ${randomKeyable(makeStruct)}>`

// make a method param
const makeParam = (typeMaker: () => string): string => `${randomStructName().toLowerCase()}: ${typeMaker()}`
// make optional method param
const makeOptionalParam = (typeMaker: () => string): string => `${randomStructName().toLowerCase()}?: ${typeMaker()}`

// make a method for interface
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

const makeInterface = (typeMaker: () => string): string => {
  const methodCount = randomNumber(5, 12)
  let methods = ''
  for (let i = 0; i < methodCount; i++) {
    methods = methods.concat(makeMethod(typeMaker) + '\n\n')
  }
  return `
  interface ${randomStructName().toLowerCase()} {
    ${methods}
  }\n`
}

const makeInterfaces = (typeMaker: () => string): string => {
  const num = randomNumber(5, 12)
  let interfaces = ''
  for (let i = 0; i < num; i++) {
    interfaces = interfaces.concat(makeInterface(typeMaker))
  }
  return interfaces
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

const makeTypeAlias = (name: string, typeMaker: () => string): string => {
  let props = ''
  const propCount = randomNumber(5, 22)
  for (let i = 0; i < propCount; i++) {
    props = props.concat(`prop${i}${optional()}: ${typeMaker()};\n`)
  }
  return `
  ${useCbor()}
  type ${name} = {
    ${props}
  }\n`
}

const makeTypeAliases = (names: string[], typeMaker: () => string): string => {
  let types = ''
  for (const name of names) {
    types = types.concat(makeTypeAlias(name, typeMaker))
  }
  return types
}

export const getSourceFile = (source: string, project: Project): SourceFile =>
  project.createSourceFile('test.ts', source)

const makeTypeNames = (): Set<string> => {
  const num = randomNumber(30, 50)
  let names: string[] = []
  for (let i = 0; i < num; i++) {
    names = names.concat(randomStructName())
  }
  return new Set<string>(names)
}
export const makeTestFile = (project: Project, fileName = 'test.ts'): SourceFile => {
  const typeNames: string[] = [...makeTypeNames()]
  const randomStruct = () => typeNames[randomNumber(0, typeNames.length)]
  const makers = [makeDict, makeList, makeTuple2, makeTuple3, makeTuple4, makeTuple5, randomComparable, () => 't.unit', () => 't.nil']
  const typeMaker = () => makers[randomNumber(0, makers.length)](randomStruct)
  const types = makeTypeAliases(typeNames, typeMaker)
  const interfaces = makeInterfaces(typeMaker)
  return project.createSourceFile(fileName, types.concat(interfaces))
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
  /**
 * cbor
 */
type CborType = {}

/**
 * cbor
 */

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
