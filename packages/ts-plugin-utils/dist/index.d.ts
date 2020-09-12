import { DataType, Import, Message, Method, MutationService, Param, QueryService, Schema, StructLiteralProp } from '@typerpc/schema';
export declare const typeMap: Map<string, string>;
export declare const typeLiteral: (props: ReadonlyArray<StructLiteralProp>) => string;
export declare const dataType: (type: DataType) => string;
export declare const scalarFromQueryParam: (paramName: string, type: DataType) => string;
export declare const fromQueryString: (paramName: string, type: DataType) => string;
export declare const handleOptional: (isOptional: boolean) => string;
export declare const buildType: (msg: Message) => string;
export declare const buildTypes: (schema: Schema) => string;
export declare const buildParams: (params: ReadonlyArray<Param>) => string;
export declare const buildMethodSignature: (method: Method) => string;
export declare const buildInterface: (svc: QueryService | MutationService) => string;
export declare const buildInterfaces: (schema: Schema) => string;
export declare const paramNames: (params: ReadonlyArray<Param>) => string;
export declare const buildParamsWithTypes: (params: ReadonlyArray<Param>) => string;
export declare const buildParamsVar: (params: ReadonlyArray<Param>) => string;
export declare const buildMsgImports: (imports: ReadonlyArray<Import>) => string;
//# sourceMappingURL=index.d.ts.map