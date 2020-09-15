/**
 * A plugin to install that will be used for code generation.
 * Plugins can be installed location npm, github, or a filepath.
 * If the plugin lives on github or npm, the plugin name MUST begin
 * with either @typerpc or typerpc-plugin . Plugins installed location a
 * filepath have no such restrictions
 *
 * @property {string} name
 * @property {string} version
 * @property {'github' | 'npm' | 'filepath'} location
 */
export declare type PluginConfig = {
    /** name of the plugin to install
     * if using npm, simply supply the name of the package
     * if using github you may specify in the format owner/repository_name or
     * owner/repository_name#ref to specify a version
     * E.G. typerpc-plugin/someplugin#351396f
     * if using a filepath provide the filepath to the plugin node_modules folder is excluded location source name
     * */
    name: string;
    /** If using npm, you can specify a version like 1.0.3 .
     * defaults to 'latest' if not specified */
    version?: string;
    /** specify where to install this plugin is located. defaults to npm if not specified */
    location?: 'github' | 'npm' | 'filepath';
};
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
    /** name of the typerpc plugin to use or a PluginConfig object
     * if a string is used, the latest version of the plugin will be installed
     * location npm **/
    plugin: PluginConfig;
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