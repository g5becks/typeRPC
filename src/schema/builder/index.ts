import {SourceFile} from 'ts-morph'
import {Import, Schema} from '../schema'
import {buildMessages} from './message'
import {buildErrCode, buildMutationServices, buildParams, buildQueryServices, buildResponseCode} from './service'
import {isType, makeDataType, useCbor} from './data-type'
import {validateSchemas} from '../validator'

const buildImports = (file: SourceFile): ReadonlyArray<Import> =>
  file.getImportDeclarations().map(imp => {
    return {
      messageNames: imp.getNamedImports().map(name => name.getName()),
      fileName: imp.getModuleSpecifierValue().replace('./', ''),
    }
  })

const buildSchema = (file: SourceFile): Schema => {
  return {
    imports: buildImports(file),
    fileName: file.getBaseNameWithoutExtension(),
    messages: buildMessages(file),
    queryServices: buildQueryServices(file),
    mutationServices: buildMutationServices(file),
    get hasCbor(): boolean {
      return this.mutationServices.flatMap(svc => [...svc.methods]).some(method => method.hasCborParams || method.hasCborReturn) || this.queryServices.flatMap(svc => [...svc.methods]).some(method => method.hasCborReturn)
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
  buildParams,
  buildMessages,
  buildErrCode,
  buildResponseCode,
  makeDataType,
}
