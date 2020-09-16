import { CommandModule } from 'yargs';
declare type Args = Readonly<Partial<{
    tsconfig: string;
    plugin: string;
    local: string;
    github: string;
    version: string;
    out: string;
    pkg: string;
    fmt: string;
}>>;
export declare const gen: CommandModule<Record<string, unknown>, Args>;
export {};
//# sourceMappingURL=gen.d.ts.map