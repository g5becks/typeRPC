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

const comparables = ['t.bool', 't.int8', 't.uint8', 't.uint16', 't.int16', 't.int32', 't.uint32', 't.int64', 't.uint64', 't.float32', 't.float64', 't.str', 't.timestamp', 't.err', 't.dyn']

const randomComparable = () => comparables[randomNumber(0, comparables.length - 1)]
const containers = [`t.Dict<${randomComparable()}, ${randomComparable()}>`, `t.List<${randomComparable()}>`, `t.Tuple2<${randomComparable()}, ${randomComparable()}>`, `t.Tuple3<${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `t.Tuple4<${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`, `t.Tuple5<${randomComparable()},${randomComparable()}, ${randomComparable()}, ${randomComparable()}, ${randomComparable()}>`]

const randomContainer = (): string => containers[randomNumber(0, containers.length - 1)]

const randomStructName =  (): string => faker.name.firstName().toUpperCase()

const keyables = [randomComparable(), randomContainer(), randomStructName()]

const randomKeyable = () => keyables[randomNumber(0, keyables.length - 1)]

const makeDict = () => `t.Dict<${randomComparable()}, ${randomKeyable()}>`

const makeList = () => `t.List<${randomKeyable()}>`

const makeTuple2 = () => `t.Tuple2<${randomKeyable()}, ${randomKeyable()}>`

const makeTuple3 = () => `t.Tuple3<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeTuple4 = () => `t.Tuple4<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makeTuple5 = () => `t.Tuple5<${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}, ${randomKeyable()}>`

const makers = [randomStructName, makeDict, makeList, makeTuple2, makeTuple3, makeTuple4, makeTuple5, randomComparable, () => 't.unit', () => 't.nil']

const makeRandomDataType = (): string => makers[randomNumber(0, makers.length - 1)]()

export const makeRandomType = (propCount: number): string => {
  let props = ''
  for (let i = 0; i < propCount; i++) {
    props = props.concat(`prop${propCount}: ${makeRandomDataType()};\n`)
  }
  return `type TestType = {
    ${props}
  }`
}

export const getSourceFile = (source: string, project: Project): SourceFile =>
  project.createSourceFile('test.ts', source)

