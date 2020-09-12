import { Project, SourceFile } from 'ts-morph';
import { GeneratorConfig } from '@typerpc/config';
import pino from 'pino';
import { ChildProcess } from 'child_process';
export declare const getConfigFile: (project: Project) => SourceFile | undefined;
export declare type ParsedConfig = GeneratorConfig & {
    configName: string;
};
export declare const parseConfig: (file: SourceFile | undefined) => ParsedConfig[];
export declare const logger: (project: Project) => pino.Logger;
export declare const format: (path: string, formatter: string, onError: (error: any) => void, onComplete: (msg: string) => void) => ChildProcess;
//# sourceMappingURL=utils.d.ts.map