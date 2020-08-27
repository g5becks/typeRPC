import {Project, SourceFile} from 'ts-morph'
import {
  genRandomQueryParamableList,
  genRandomQueryParamableScalar,
  makeDict,
  makeList,
  makeRandomComparable,
  makeRandomMsgName,
  makeTuple2,
  makeTuple3,
  makeTuple4,
  makeTuple5,
  randomNumber,
} from './data-gen'
import {makeServices} from './service-gen'
import {makeMsgNames, makeRpcMessages} from './message-gen'

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

export const getSourceFile = (source: string, project: Project): SourceFile =>
  project.createSourceFile('tes$.ts', source)

export const makeTestFile = (project: Project, fileName = 'tes$.ts'): SourceFile => {
  const typeNames: string[] = [...makeMsgNames()]
  const randomStruct = () => typeNames[randomNumber(0, typeNames.length)]
  const makers = [makeDict, makeList, makeTuple2, makeTuple3, makeTuple4, makeTuple5, makeRandomComparable, () => '$.unit', () => '$.nil']
  const queryParamableMakers = [genRandomQueryParamableScalar, genRandomQueryParamableList]
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
    const fileName = makeRandomMsgName().toLowerCase() + i.toString() + '.ts'
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
