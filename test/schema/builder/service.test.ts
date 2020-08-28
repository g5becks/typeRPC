import {genMsgNames, genSourceFile, testQuerySvc} from '../util'
import {testing} from '../../../src/schema'
import {Project} from 'ts-morph'
import {genServices} from '../util/service-gen'

let project: Project
beforeEach(() => {
  project = new Project()
})
const {buildErrCode,
  parseServiceMethods,
  buildResponseCode,
  buildParams,
} = testing

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
  const svc = genServices('Query', genMsgNames())
  console.log(svc)
  const services = genSourceFile(svc, project).getTypeAliases()
  const methods = services.flatMap(svc => parseServiceMethods(svc))
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
