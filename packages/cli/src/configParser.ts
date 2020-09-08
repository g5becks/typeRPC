import { ObjectLiteralExpression, Project, SyntaxKind } from 'ts-morph'
import { GeneratorConfig } from '@typerpc/config'

const getConfigFile = (project: Project) =>
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
        throw new Error()
    }

    return { outputPath, plugin, packageName, formatter }
}
const parseConfigVar = (project: Project): GeneratorConfig[] => {
    // parse object literal from the config var then get all properties
    const props = getConfigFile(project)
        ?.getVariableDeclaration('config')
        ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression)
        ?.getChildrenOfKind(SyntaxKind.PropertyAssignment)
    // if there are no properties throw and exit
    if (typeof props === 'undefined') {
        throw new Error()
    }
    console.log(props.length)
    // get the Generator config from each property assignment
    // pass is go the parseGeneratorConfig function

    return props!
        .flatMap((prop) => prop.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression))
        .flatMap((cfg) => parseGeneratorConfig(cfg))
}
