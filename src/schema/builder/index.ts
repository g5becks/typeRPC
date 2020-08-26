import {SourceFile} from 'ts-morph'
import {Schema} from '../schema'
import {buildMessages, buildProps} from './message'
import {buildErrCode, buildHttpVerb, buildMethod, buildParams, buildResponseCode, buildServices} from './service'
import {isType, makeDataType, useCbor} from './data-type'
import {validateSchemas} from '../validator'

const buildSchema = (file: SourceFile): Schema => {
  return {
    imports: file.getImportStringLiterals().map(imp => imp.getLiteralValue()),
    fileName: file.getBaseNameWithoutExtension(),
    messages: buildMessages(file),
    services: buildServices(file),
    get hasCbor(): boolean {
      return this.services.flatMap(service => [...service.methods]).some(method => method.hasCborParams || method.hasCborReturn) || this.services.some(service => service.useCbor)
    },
  }
}
export const buildSchemas = (sourceFiles: SourceFile[]): Schema[] | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : [...new Set<Schema>(sourceFiles.map(file => buildSchema(file)))]
}
export const internalTesting = {
  useCbor,
  isType,
  buildSchema,
  buildMethod,
  buildParams,
  buildProps,
  buildMessages,
  buildHttpVerb,
  buildErrCode,
  buildResponseCode,
  makeDataType,
}
