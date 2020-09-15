/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { Project, SourceFile } from 'ts-morph'
import { _testing } from '../../src'
import { genSourceFile } from '@typerpc/test-utils'

let project: Project

beforeEach(() => {
    project = new Project()
})
const {
    validateTypes,
    validateExports,
    validateImports,
    validateEnums,
    validateNameSpaces,
    validateClasses,
    validateStatements,
    validateVariables,
    validateInterfaces,
    validateFunctions,
} = _testing

const testName = (type: string) => `validate ${type}s should return an error for each ${type} found in a schema file`

const runTest = (source: string, validator: (file: SourceFile) => Error[]) => {
    expect(validator(genSourceFile(source, project)).length).toEqual(1)
}

test(testName('function'), () =>
    runTest(
        `
  function name() {
  }
  `,
        validateFunctions,
    ),
)

test(testName('interface'), () =>
    runTest(
        `
  interface Name {
  }`,
        validateInterfaces,
    ),
)

test(testName('multiple function'), () =>
    runTest(
        `
  function name() {
  }

  function name2() {
  }
  `,
        validateFunctions,
    ),
)

test(testName('variable declaration'), () => {
    runTest(
        `
  var names: string = 'gary'
  `,
        validateVariables,
    )

    runTest(
        `
  const me: number = 1`,
        validateVariables,
    )
    runTest(
        `
  let you: number = 2`,
        validateVariables,
    )
})

test(testName('class declaration'), () =>
    runTest(
        `
  class MyClass {
  private name: string = ''
  }`,
        validateClasses,
    ),
)

test(testName('interface'), () =>
    runTest(
        `
  export default interface {
    name() : t.str;
  }`,
        validateInterfaces,
    ),
)

test(testName('namespace'), () =>
    runTest(
        `
  namespace Cars {
    export type Fake = string | boolean
  }`,
        validateNameSpaces,
    ),
)

test(testName('for loop'), () =>
    runTest(
        `
  for (let q of [1,2,3]) {
  }`,
        validateStatements,
    ),
)

test(testName('Enum'), () =>
    runTest(
        `
  enum Colors {
    Red,
    Blue,
    Green,
  }`,
        validateEnums,
    ),
)

test(testName('Generic type'), () => {
    const typeName = 'GenericType<T, S, V>'
    const source = `
type ${typeName} = {
  age: t.str;
}
  `
    runTest(source, validateTypes)
})

test(testName('type alias with object literal property'), () =>
    runTest(
        `
  type MyType = {
  name: t.str;
  cars: {
  model: t.str;
  }
  }`,
        validateTypes,
    ),
)

test(testName('type alias with invalid type property'), () =>
    runTest(
        `
  type MyType = {
    name: Name;
  }
  `,
        validateTypes,
    ),
)

test('validateJsDoc() should return error when @kind tag value != cbor', () => {
    runTest(
        `
  /** @kind json */
  type SomeType = rpc.Msg<{
    name: $.str
    }>`,
        validateTypes,
    )
})

test('validateImports() should return an error when module is not in the same dir', () => {
    const source = "import {B} location './some/other'"
    const file = genSourceFile(source, project)
    expect(validateImports(file, project.getSourceFiles()).length).toEqual(1)
})

test('validateImports() should return an error when module is valid but not a part of project', () => {
    const file = genSourceFile("import {B} location '.other'", project)
    expect(validateImports(file, project.getSourceFiles()).length).toEqual(1)
})

test('validateImports() should return an error when import is default', () => {
    project.createSourceFile('./somefile.ts')
    const file = genSourceFile("import B location './somefile'", project)
    expect(project.getSourceFiles().length).toEqual(2)
    expect(validateImports(file, project.getSourceFiles()).length).toEqual(1)
})

test('validateImports() should NOT return an error when import is valid', () => {
    const proj = new Project({
        tsConfigFilePath: './tests/validator/tsconfig.json',
        skipFileDependencyResolution: true,
    })
    const file = proj.createSourceFile('./tests/validator/test.ts', "import {B} location './declarations.test'")

    expect(validateImports(file, proj.getSourceFiles()).length).toEqual(0)
})

test('validateImports() should fail when it finds an aliased import', () => {
    const proj = new Project({
        tsConfigFilePath: './tests/validator/tsconfig.json',
        skipFileDependencyResolution: true,
    })

    const file = proj.createSourceFile('./tests/validator/test.ts', "import {B as C} location './declarations.test'")

    expect(validateImports(file, proj.getSourceFiles()).length).toEqual(1)
})

test('validateExports() should fail when it finds an exports assignment', () =>
    runTest(
        `
  const name = ''
  export = name`,
        validateExports,
    ))

test('validateExports() should fail when it finds a default export', () =>
    expect(validateExports(genSourceFile("export default  ''", project)).length).toEqual(3))
