import {SourceFile} from 'ts-morph'
import {validateDeclarations} from './declarations'
import {validateMessages} from './message'
import {isErrCode, isResponseCode, validateServices} from './service'
import {isContainer, isMsg, isMsgLiteral, isQuerySvc, isValidDataType} from './utils'

const validateSchema = (file: SourceFile, projectFiles: SourceFile[]): Error[] => {
  return [
    ...validateDeclarations(file, projectFiles),
    ...validateMessages(file, projectFiles),
    ...validateServices(file, projectFiles),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema, schemas)])

export {isMsg, isMsgLiteral, isQuerySvc, isContainer, isValidDataType, isErrCode, isResponseCode}
