import { Schema } from '@typerpc/schema';
export declare type Code = {
    readonly fileName: string;
    readonly source: string;
};
export declare type TypeRpcPlugin = (schemas: Schema[]) => Code[];
//# sourceMappingURL=index.d.ts.map