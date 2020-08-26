import {SourceFile} from 'ts-morph'
import {Import, Schema} from '../schema'
import {buildMessages, buildProps} from './message'
import {buildErrCode, buildHttpVerb, buildMethod, buildParams, buildResponseCode, buildServices} from './service'
import {isType, makeDataType, useCbor} from './data-type'
import {validateSchemas} from '../validator'

const buildImports = (file: SourceFile): ReadonlyArray<Import> =>
  file.getImportDeclarations().map(imp => {
    return {
      messageNames: imp.getNamedImports().map(name => name.getName()),
      fileName: imp.getModuleSpecifierValue().replace('./', ''),
    }
  })

const buildSchema = (file: SourceFile, projectFiles: SourceFile[]): Schema => {
  return {
    imports: buildImports(file),
    fileName: file.getBaseNameWithoutExtension(),
    messages: buildMessages(file, projectFiles),
    services: buildServices(file, projectFiles),
    get hasCbor(): boolean {
      return this.services.flatMap(service => [...service.methods]).some(method => method.hasCborParams || method.hasCborReturn) || this.services.some(service => service.useCbor)
    },
  }
}
export const buildSchemas = (sourceFiles: SourceFile[]): Schema[] | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : [...new Set<Schema>(sourceFiles.map(file => buildSchema(file, sourceFiles)))]
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
