import { Project } from 'ts-morph';
import { TypeRpcPlugin } from '@typerpc/plugin';
export declare const isValidPlugin: (plugin: any) => plugin is TypeRpcPlugin;
export declare class PluginManager {
    #private;
    private constructor();
    static create(project: Project): PluginManager;
    private pluginPath;
    private pluginIsInstalled;
    private installPlugin;
    opts: () => string;
    list: () => string;
    install(plugins: string[], onInstalled: (plugin: string) => void, onInstalling: (plugin: string) => void): Promise<void>;
    require(plugin: string): TypeRpcPlugin | Error;
}
//# sourceMappingURL=index.d.ts.map