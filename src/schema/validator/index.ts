import {SourceFile} from 'ts-morph'
import {validateDeclarations} from './declarations'

const validateSchema = (file: SourceFile): Error[] => {
  return [
    ...validateDeclarations(file),
  ]
}
// Valid HTTP Error status codes
export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema)])
