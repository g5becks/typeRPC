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

import { Project } from 'ts-morph'
import { _testing } from '../../src'
import { genMsgNames, genServices, genSourceFile } from '@typerpc/test-utils'

let project: Project

beforeEach(() => {
    project = new Project()
})

const {
    validateService,
    validateNotGeneric,
    validateReturnType,
    validateMethodJsDoc,
    validateQueryMethodParams,
    parseQueryServices,
    parseServiceMethods,
} = _testing

test('validateService() should not return error when service is valid', () => {
    const services = parseQueryServices(genSourceFile(genServices('Query', genMsgNames()), project))
    for (const service of services) {
        expect(validateService(service).length).toBe(0)
    }
})

test('validateMethodJsDoc() should return an error when @return tag has invalid status', () => {
    const source = `
  interface Test {
    /** @returns 0 */
    method()
  }`
    const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
    expect(validateMethodJsDoc(method).length).toEqual(1)
})

test('validateMethodJsDoc() should NOT return an error when @return tag has valid status', () => {
    const source = `
  interface Test {
    /** @returns 301 */
    method()
  }`
    const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
    expect(validateMethodJsDoc(method).length).toEqual(0)
})

test('validateMethodJsDoc() should NOT return an error when @throws tag has valid status', () => {
    const source = `
  interface Test {
    /** @throws 501 */
    method()
  }`
    const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
    expect(validateMethodJsDoc(method).length).toEqual(0)
})

test('validateMethodJsDoc() should return an error when @throws tag has invalid status', () => {
    const source = `
  interface Test {
    /** @throws 550 */
    method()
  }`
    const method = genSourceFile(source, project).getInterface('Test')!.getMethod('method')!
    expect(validateMethodJsDoc(method).length).toEqual(1)
})

test('validateMethodNotGeneric() should return an error when method is generic', () => {
    const source = `
  type SomeSvc = rpc.MutationSvc<{
    getNames<T extends $.int8>(namesSlot: T): $.list<$.str>;
  }>`
    const method = parseServiceMethods(genSourceFile(source, project).getTypeAlias('SomeSvc')!)[0]
    expect(validateNotGeneric(method).length).toEqual(1)
})

test('validateReturnType() should return an error when return type is not valid', () => {
    const source = `type SomeSvc = rpc.MutationSvc<{
    getNames<T extends $.int8>(namesSlot: T): string[];
    getNames<T extends $.int8>(namesSlot: T): $.list<$.str>;
  }>
  `
    const methods = parseServiceMethods(genSourceFile(source, project).getTypeAlias('SomeSvc')!)
    expect(validateReturnType(methods[0]).length).toEqual(1)
    expect(validateReturnType(methods[1]).length).toEqual(0)
})

test('validateQueryMethodParams() should return an error when an invalid type is used', () => {
    const source = `
  type SomeSvc = rpc.QuerySvc<{
    testMethod(names: $.map<$.int8, $.bool>):$.unit;
    testMethod(names: $.list<$.int8>): $.unit;
  }>`
    const methods = parseServiceMethods(genSourceFile(source, project).getTypeAlias('SomeSvc')!)
    expect(validateQueryMethodParams(methods[0]).length).toEqual(1)
    expect(validateQueryMethodParams(methods[1]).length).toEqual(0)
})
