import {SourceFile} from 'ts-morph'
import {internal as decInternal, validateDeclarations} from './declarations'
import {validateMessage, validateMessages} from './message'
import {isErrCode, isResponseCode, serviceValidatorTesting, validateServices} from './service'
import {isContainer, isMsg, isMsgLiteral, isPrimitive, isQuerySvc, isValidDataType, isValidMsg} from './utils'

const validateSchema = (file: SourceFile, projectFiles: SourceFile[]): Error[] => {
  return [
    ...validateDeclarations(file, projectFiles),
    ...validateMessages(file),
    ...validateServices(file),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema, schemas)])

export {isMsg, isValidMsg, isMsgLiteral, isQuerySvc, isContainer, isValidDataType, isErrCode, isResponseCode, validateMessage, isPrimitive}

export const internal = {
  ...decInternal,
  ...serviceValidatorTesting,
  validateMessage,
  isValidMsg,
  isValidDataType,
  isPrimitive,
}

