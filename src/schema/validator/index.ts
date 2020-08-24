import {SourceFile} from 'ts-morph'
import {validateDeclarations} from './declarations'
import {validateMessages} from './message'

const validateSchema = (file: SourceFile): Error[] => {
  return [
    ...validateDeclarations(file),
    ...validateMessages(file),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema)])
