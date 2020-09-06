import { genSourceFile, genTestFile } from '../../../test-utils/src'
import { Project } from 'ts-morph'
import { testing } from '../../../src/schema'

const { buildSchema, parseMessages, parseMutationServices, parseQueryServices, buildImports } = testing
test('buildSchema() should return schema with correct number of messages and services', () => {
    const file = genSourceFile(genTestFile(), new Project())
    const schema = buildSchema(file, '')
    expect(parseMessages(file).length).toEqual(schema.messages.length)
    expect(parseQueryServices(file).length).toEqual(schema.queryServices.length)
    expect(parseMutationServices(file).length).toEqual(schema.mutationServices.length)
    expect(file.getImportDeclarations().length).toEqual(schema.imports.length)
})

test('buildImports() should return the correct import names', () => {
    const file = genSourceFile(genTestFile(), new Project())
    const imports = buildImports(file)
    const names = file
        .getImportDeclarations()
        .flatMap((imp) => imp.getNamedImports())
        .flatMap((imp) => imp.getName())
    expect(names).toEqual(imports.flatMap((imp) => imp.messageNames))
})
