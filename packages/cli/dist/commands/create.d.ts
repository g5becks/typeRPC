import { CommandModule } from 'yargs';
declare type Args = Readonly<Partial<{
    name: string;
    client: string;
    server: string;
    yarn: boolean;
}>>;
export declare const create: CommandModule<Record<string, unknown>, Args>;
export {};
//# sourceMappingURL=create.d.ts.map