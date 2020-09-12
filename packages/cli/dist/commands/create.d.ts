import { Command, flags } from '@oclif/command';
declare class Create extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        name: flags.IOptionFlag<string | undefined>;
        force: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
    };
    static args: {
        name: string;
    }[];
    run(): Promise<void>;
}
export = Create;
//# sourceMappingURL=create.d.ts.map