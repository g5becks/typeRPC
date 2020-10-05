import { DataType, Import, Message, MutationService, Param, QueryService, Schema } from '@typerpc/schema';
export declare const typeMap: Map<string, string>;
export declare const dataType: (type: DataType) => string;
export declare const scalarFromQueryParam: (paramName: string, type: DataType) => string;
export declare const fromQueryString: (paramName: string, type: DataType) => string;
export declare const handleOptional: (isOptional: boolean) => string;
export declare const buildMsgClass: (msg: Message) => string;
export declare const buildTypes: (schema: Schema) => string;
export declare const buildAbstractClass: (svc: QueryService | MutationService) => string;
export declare const buildInterfaces: (schema: Schema) => string;
export declare const paramNames: (params: ReadonlyArray<Param>) => string;
export declare const buildMsgImports: (imports: ReadonlyArray<Import>) => string;
//# sourceMappingURL=index.d.ts.map