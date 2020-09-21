import { Project, SourceFile } from 'ts-morph';
import { GeneratorConfig } from '@typerpc/config';
import { ChildProcess } from 'child_process';
import { Logger } from 'tslog';
export declare const getConfigFile: (project: Project) => SourceFile | undefined;
export declare type ParsedConfig = GeneratorConfig & {
    configName: string;
};
export declare const parseConfig: (file: SourceFile | undefined) => ParsedConfig[];
export declare const createLogger: (project: Project) => Logger;
export declare const format: (path: string, formatter: string, onError: (error: any) => void, onComplete: (msg: string) => void) => ChildProcess;
export declare const getRpcConfigPath: (file: SourceFile | undefined) => string | undefined;
export declare const scaffold: (projectName: string, yarn?: boolean | undefined, client?: string | undefined, server?: string | undefined) => Promise<void>;
//# sourceMappingURL=utils.d.ts.map