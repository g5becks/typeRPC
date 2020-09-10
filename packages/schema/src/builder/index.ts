import { SourceFile } from 'ts-morph'
import { Import, Schema } from '../index'
import { buildMessages } from './message'
import {
    buildErrCode,
    buildMethod,
    buildMutationMethod,
    buildMutationServices,
    buildParams,
    buildQueryMethod,
    buildQueryServices,
    buildResponseCode,
    hasCborParams,
} from './service'
import { isType, makeDataType, useCbor } from './data-type'

export { useCbor }
const buildImports = (file: SourceFile): ReadonlyArray<Import> =>
    file
        .getImportDeclarations()
        .filter((imp) => imp.getModuleSpecifierValue() !== '@typerpc/types')
        .map((imp) => {
            return {
                messageNames: imp.getNamedImports().map((name) => name.getName()),
                fileName: imp.getModuleSpecifierValue().replace('./', ''),
            }
        })

const buildSchema = (file: SourceFile, packageName: string): Schema => {
    return {
        packageName,
        imports: buildImports(file),
        fileName: file.getBaseNameWithoutExtension(),
        messages: buildMessages(file),
        queryServices: buildQueryServices(file),
        mutationServices: buildMutationServices(file),
        get hasCbor(): boolean {
            return (
                this.mutationServices
                    .flatMap((svc) => [...svc.methods])
                    .some((method) => method.hasCborParams || method.hasCborReturn) ||
                this.queryServices.flatMap((svc) => [...svc.methods]).some((method) => method.hasCborReturn)
            )
        },
    }
}
export const buildSchemas = (sourceFiles: SourceFile[], packageName: string): Schema[] => [
    ...new Set<Schema>(sourceFiles.map((file) => buildSchema(file, packageName))),
]

export const internalTesting = {
    useCbor,
    isType,
    buildSchema,
    buildParams,
    buildMessages,
    buildErrCode,
    buildResponseCode,
    makeDataType,
    buildMutationMethod,
    buildMethod,
    buildQueryMethod,
    hasCborParams,
    buildImports,
}
