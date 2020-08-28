import {SourceFile} from 'ts-morph'
import {validateDeclarations, internal} from './declarations'
import {validateMessages} from './message'
import {isErrCode, isResponseCode, validateServices} from './service'
import {isContainer, isMsg, isMsgLiteral, isQuerySvc, isValidDataType, isValidMsg} from './utils'

const validateSchema = (file: SourceFile, projectFiles: SourceFile[]): Error[] => {
  return [
    ...validateDeclarations(file, projectFiles),
    ...validateMessages(file),
    ...validateServices(file),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema, schemas)])

export {isMsg, isValidMsg, isMsgLiteral, isQuerySvc, isContainer, isValidDataType, isErrCode, isResponseCode, internal}

