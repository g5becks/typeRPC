import { ObjectLiteralExpression, Project, SourceFile, SyntaxKind } from 'ts-morph'
import { GeneratorConfig } from '@typerpc/config'

export const getConfigFile = (project: Project) =>
    project.getSourceFile((file) => file.getBaseName().toLowerCase() === '.rpc.config.ts')

const parseGeneratorConfig = (obj: ObjectLiteralExpression): GeneratorConfig => {
    const outputPath = obj
        .getProperty('outputPath')
        ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
        ?.getLiteralValue()
        ?.trim()
    const plugin = obj.getProperty('plugin')?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]?.getLiteralValue()?.trim()
    const packageName = obj
        .getProperty('packageName')
        ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
        ?.getLiteralValue()
        ?.trim()
    const formatter = obj
        .getProperty('formatter')
        ?.getChildrenOfKind(SyntaxKind.StringLiteral)[0]
        ?.getLiteralValue()
        ?.trim()
    if (!outputPath || !plugin || !packageName) {
        throw new Error(`
        error in config file: ${obj.getSourceFile().getFilePath()},
        at line number: ${obj.getStartLineNumber()},
        message: all generator config objects must contain the following properties: [outputPath, plugin, packageName]`)
    }

    return { outputPath, plugin, packageName, formatter }
}

export type ParsedConfig = GeneratorConfig & { configName: string }

export const parseConfig = (file: SourceFile | undefined): ParsedConfig[] => {
    // parse object literal from the config var then get all properties
    const conf = file?.getVariableDeclaration('config')
    const props = conf
        ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression)
        ?.getChildrenOfKind(SyntaxKind.PropertyAssignment)
    // if there are no properties throw and exit
    if (typeof props === 'undefined') {
        throw new Error(`error in config file. Invalid config object, no generators found.`)
    }
    let configs: ParsedConfig[] = []
    // get the Generator config from each property assignment
    // pass is go the parseGeneratorConfig function
    for (const prop of props) {
        configs = configs.concat({
            ...parseGeneratorConfig(prop.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0]),
            configName: prop.getFirstChild()?.getText() ?? '',
        })
    }
    return configs
}
