import { Project } from 'ts-morph';
import { TypeRpcPlugin } from '@typerpc/plugin';
import { PluginConfig } from '@typerpc/config';
export declare const isValidPlugin: (plugin: any) => plugin is TypeRpcPlugin;
export declare const isPluginConfig: (config: Record<string, unknown>) => config is PluginConfig;
export declare const isGitHub: (location: any) => location is {
    github: string;
};
export declare const isLocal: (location: any) => location is {
    local: string;
};
export declare class PluginManager {
    #private;
    private constructor();
    static create(project: Project): PluginManager;
    private pluginPath;
    private pluginIsInstalled;
    private installPlugin;
    opts: () => string;
    list: () => string;
    install(plugins: PluginConfig[], onInstalled: (plugin: string) => void, onInstalling: (plugin: string) => void): Promise<void>;
    require(plugin: string): TypeRpcPlugin | Error;
}
//# sourceMappingURL=index.d.ts.map