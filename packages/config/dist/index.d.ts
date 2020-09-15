/**
 * Config options for code generation
 *
 * @property {string} out
 * @property {string} plugin
 * @property {string} pkg
 * @property {string| undefined} fmt
 **/
export declare type GeneratorConfig = Readonly<{
    /** directory to write generated code **/
    out: string;
    /** name of the typerpc plugin to use **/
    plugin: string;
    /** package name to use in generated code **/
    pkg: string;
    /**
     * A string that will be used to execute
     * the code fmt of choice.
     * Generated code in out will be passed
     * as an argument this string.
     *
     * E.G. 'prettier --single-quote --trailing-comma es5 --no-semi --parser typescript --write'
     * **/
    fmt?: string;
}>;
export declare type Config = {
    [key: string]: GeneratorConfig;
};
//# sourceMappingURL=index.d.ts.map
