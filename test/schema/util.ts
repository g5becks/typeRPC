import {MethodSignature, Project, SourceFile} from 'ts-morph'
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

const keyables = [randomComparable(), randomContainer()]

const randomKeyable = () => keyables[randomNumber(0, keyables.length - 1)]

const makeDict = () => `t.Dict<${randomComparable()}, ${randomKeyable()}>`

const makeList = () => `t.List<${randomKeyable()}>`

const makeTuple2 = () => `t.Tuple2<${randomKeyable()}, ${randomKeyable()}>`

const makeTuple3 = () => `t.Tuple3<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeTuple4 = () => `t.Tuple4<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeTuple5 = () => `t.Tuple5<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const buildRandomMethod = (): string => {
  const paramsCount = randomNumber(0, 6)
  let params = ''
  for (let i = 0; i <  paramsCount; i++) {
    const useComma = i !== paramsCount - 1 ? ', ' : ''
    params = params.concat(`${buildRandomParam()}${useComma}`)
  }
  return `${randomStructName().toLowerCase()}(${params}): ${makeRandomDataType()};`
}

export const makeRandomInterface = (): string => {
  const methodCount = randomNumber(5, 26)
  let methods = ''
  for (let i = 0; i < methodCount; i++) {
    methods = methods.concat(buildRandomMethod() + '\n\n')
  }
  return `
  interface ${randomStructName().toLowerCase()} {
    ${methods}
  }`
}

const optional = () => randomNumber(0, 2) === 0 ? '' : '?'

const useCbor = () => {
  const cbor = `
  /**
 * cbor
 */\n`
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

export const makeTestMethods = (project: Project): MethodSignature[] => getSourceFile(makeRandomInterface(), project).getInterfaces().flatMap(inter => inter.getMethods())

export const getSourceFile = (source: string, project: Project): SourceFile =>
  project.createSourceFile('test.ts', source)

const buildRandomParam = (typeMaker: () => string) => `${randomStructName().toLowerCase()}${optional()}: ${typeMaker()}`

const makeTypeNames = (): Set<string> => {
  const num = randomNumber(30, 50)
  let names: string[] = []
  for (let i = 0; i < num; i++) {
    names = names.concat(randomStructName())
  }
  return new Set<string>(...names)
}
const makeTestSchema = (fileName: string, project: Project): SourceFile => {
  const typeNames: string[] = [...makeTypeNames()]
  const randomStruct = () => typeNames[randomNumber(0, typeNames.length - 1)]
  const makers = [makeDict, makeList, makeTuple2, makeTuple3, makeTuple4, makeTuple5, randomComparable, () => 't.unit', () => 't.nil', randomStruct]
  const typeMaker = () => makers[randomNumber(0, makers.length - 1)]()
  const types = makeTypeAliases(typeNames, typeMaker)
  return project.createSourceFile(fileName, source)
}

export const makeTestSchemasFiles = (project: Project): SourceFile[] => {
  const fileCount = randomNumber(20, 50)
  let files: SourceFile[] =  []
  for (let i = 0; i < fileCount; i++) {
    const fileName = randomStructName().toLowerCase() + i.toString() + '.ts'
    files = files.concat(makeTestSchemaFile(fileName, project))
  }
  return files
}

export type testProp = {
    isOptional: boolean;
    name: string;
    type: string;
  }
