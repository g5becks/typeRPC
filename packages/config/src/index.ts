/**
 * Config options for code generation
 *
 * @property {string} outputPath
 * @property {string} plugin
 * @property {string} packageName
 * @property {string| undefined} formatter
 **/
export type GeneratorConfig = Readonly<{
    /** directory to write generated code **/
    outputPath: string
    /** name of the typerpc plugin to use **/
    plugin: string
    /** package name to use in generated code **/
    packageName: string
    /**
     * A string that will be used to execute
     * the code formatter of choice.
     * Generated code in outputPath will be passed
     * as an argument this string.
     *
     * E.G. 'prettier --single-quote --trailing-comma es5 --no-semi --parser typescript --write'
     * **/
    formatter?: string
    /** package name to use in generated code **/
}>

export type Config = { [key: string]: GeneratorConfig }
