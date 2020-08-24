import {SourceFile} from 'ts-morph'
import {validateDeclarations} from './declarations'
import {validateMessages} from './message'
import {validateServices} from './service'

const validateSchema = (file: SourceFile): Error[] => {
  return [
    ...validateDeclarations(file),
    ...validateMessages(file),
    ...validateServices(file),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema)])
