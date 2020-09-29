import { Message, MutationMethod, QueryMethod } from '@typerpc/schema';
export declare const requestSchemaName: (svcName: string, method: MutationMethod | QueryMethod) => string;
export declare const responseSchemaName: (svcName: string, method: MutationMethod | QueryMethod) => string;
export declare const buildMsgSchema: (msg: Message, hash: string) => string;
export declare const buildRequestSchema: (svcName: string, method: MutationMethod | QueryMethod) => string;
export declare const buildResponseSchema: (svcName: string, method: MutationMethod | QueryMethod) => string;
//# sourceMappingURL=fluent.d.ts.map