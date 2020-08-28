import {genSourceFile, testQuerySvc} from '../util'
import {testing} from '../../../src/schema'
import {Project} from 'ts-morph'

let project: Project
beforeEach(() => {
  project = new Project()
})
const {buildErrCode, parseServiceMethods} = testing
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
