import { Code } from '@typerpc/plugin';
import { Command, flags } from '@oclif/command';
declare class Build extends Command {
    #private;
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        tsConfig: flags.IOptionFlag<string>;
        output: flags.IOptionFlag<string | undefined>;
        plugin: flags.IOptionFlag<string | undefined>;
        formatter: flags.IOptionFlag<string | undefined>;
        packageName: flags.IOptionFlag<string | undefined>;
    };
    writeOutput(outputPath: string, code: Code[]): Promise<void>;
    validateOutputPath(outputPath: string, cfgName: string): void;
    validateTsConfigFile(tsConfigFile: string): Promise<void>;
    run(): Promise<void>;
}
export = Build;
//# sourceMappingURL=build.d.ts.map