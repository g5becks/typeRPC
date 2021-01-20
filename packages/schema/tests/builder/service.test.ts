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

import { genMsgNames, genServices, genSourceFile, hasCborParamsTestData, testQuerySvc } from '@typerpc/test-utils'
import { Project } from 'ts-morph'
import { _testing } from '../../src'

let project: Project
beforeEach(() => {
    project = new Project()
})
const { buildErrCode, parseServiceMethods, buildResponseCode, buildParams, buildMethod, buildMutationMethod } = _testing

test('buildErrCode() should return correct error code or 500 when incorrect value provided', () => {
    const methods = parseServiceMethods(genSourceFile(testQuerySvc, project).getTypeAlias('TestQuerySvc')!)

    for (let i = 0; i < methods.length; i++) {
        const errCode = buildErrCode(methods[i])
        switch (i) {
            case 0:
                expect(errCode).toEqual(404)
                break
            case 1:
                expect(errCode).toEqual(500)
                break
            case 2:
                expect(errCode).toEqual(401)
                break
            case 3:
                expect(errCode).toEqual(400)
                break
            case 4:
                expect(errCode).toEqual(403)
                break
            default:
                expect(errCode).toEqual(500)
        }
    }
})

test('buildResponseCode() should return correct HttpResponse', () => {
    const methods = parseServiceMethods(genSourceFile(testQuerySvc, project).getTypeAlias('TestQuerySvc')!)
    for (let i = 0; i < methods.length; i++) {
        const responseCode = buildResponseCode(methods[i])
        switch (i) {
            case 0:
                expect(responseCode).toEqual(200)
                break
            case 1:
                expect(responseCode).toEqual(202)
                break
            case 2:
                expect(responseCode).toEqual(201)
                break
            case 3:
                expect(responseCode).toEqual(204)
                break
            case 4:
                expect(responseCode).toEqual(301)
                break
            default:
                expect(responseCode).toEqual(200)
        }
    }
})

test('buildParams() should return correct Params', () => {
    const services = genSourceFile(genServices('Query', genMsgNames()), project).getTypeAliases()
    const methods = services.flatMap((svc) => parseServiceMethods(svc))
    for (const method of methods) {
        const params = method.getParameters()
        const builtParams = buildParams(params)
        expect(params.length).toEqual(builtParams.length)
        for (let i = 0; i < params.length; i++) {
            expect(params[i].isOptional()).toEqual(builtParams[i].isOptional)
            expect(params[i].getNameNode().getText().trim()).toEqual(builtParams[i].name)
            expect(params[i].getTypeNode()!.getText().trim()).toEqual(builtParams[i].type.toString())
        }
    }
})

test('buildMethod() should return method with correct params and return type', () => {
    const services = genSourceFile(genServices('Mutation', genMsgNames()), project).getTypeAliases()
    const methods = services.flatMap((svc) => parseServiceMethods(svc))
    for (const method of methods) {
        const builtMethod = buildMethod(method, false)
        expect(method.getReturnTypeNode()!.getText().trim()).toEqual(builtMethod.returnType.toString())
        expect(method.getNameNode().getText().trim()).toEqual(builtMethod.name)
        expect(method.getParameters().length).toEqual(builtMethod.params.length)
    }
})

test('hasCborParams() should return correct boolean value', () => {
    const file = genSourceFile(hasCborParamsTestData, project)
    const service1Methods = parseServiceMethods(file.getTypeAlias('TestService1')!)
    const service2Methods = parseServiceMethods(file.getTypeAlias('TestService2')!)
    const service3Methods = parseServiceMethods(file.getTypeAlias('TestService3')!)
    expect(buildMutationMethod(service1Methods[0], false).hasCborParams).toBeTruthy()
    expect(buildMutationMethod(service2Methods[0], false).hasCborParams).toBeTruthy()
    expect(buildMutationMethod(service3Methods[0], true).hasCborParams).toBeTruthy()
    expect(buildMutationMethod(service1Methods[1], false).hasCborReturn).toBeTruthy()
})
