import {Project, SourceFile} from 'ts-morph'
import {randomNumber} from './data-gen'
import {genMsgNames, genTestMessageFiles} from './message-gen'
import {containers, scalars} from '../../../src/schema'

export {genTestMessageFiles}
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

export const genSourceFile = (source: string, project: Project, name = 'test.ts'): SourceFile =>
  project.createSourceFile(name, source)

export const genSourceFiles = (sources: [string, string][], project: Project): SourceFile[] => {
  for (const [name, source] of sources) {
    project.createSourceFile(name, source)
  }
  return project.getSourceFiles()
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
export const optional = () => randomNumber(0, 4) === 1 ? '?' : ''
export const useCbor = () => randomNumber(0, 5) === 1 ? `
  /**
 * @kind cbor
 */
 ` : ''

export const genMsgNamesFunc = () => {
  const names = [...genMsgNames()]
  return names[randomNumber(0, names.length)]
}

export const validDataTypes = (msgNames: string[]) =>  [...scalars, ...containers, 'rpc.Msg<{', msgNames]
