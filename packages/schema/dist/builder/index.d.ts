import { SourceFile } from 'ts-morph';
import { Import, Schema } from '../index';
import { useCbor } from './data-type';
export { useCbor };
export declare const buildSchemas: (sourceFiles: SourceFile[], packageName: string) => Schema[];
export declare const internalTesting: {
    useCbor: (type: import("ts-morph").MethodSignature | import("ts-morph").TypeAliasDeclaration | undefined) => boolean;
    isType: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode>, typeText: string) => boolean;
    buildSchema: (file: SourceFile, packageName: string) => Schema;
    buildParams: (params: import("ts-morph").ParameterDeclaration[]) => Readonly<{
        name: string;
        type: import("..").DataType;
        isOptional: boolean;
    }>[];
    buildMessages: (file: SourceFile) => Readonly<{
        name: string;
        properties: readonly Readonly<{
            name: string;
            type: import("..").DataType;
            isOptional: boolean;
        }>[];
    }>[];
    buildErrCode: (method: import("ts-morph").MethodSignature) => import("..").HTTPErrCode;
    buildResponseCode: (method: import("ts-morph").MethodSignature) => import("..").HTTPResponseCode;
    makeDataType: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode>) => import("..").DataType;
    buildMutationMethod: (method: import("ts-morph").MethodSignature, isCborSvc: boolean) => import("..").MutationMethod;
    buildMethod: (method: import("ts-morph").MethodSignature, isCborSvc: boolean) => import("..").Method;
    buildQueryMethod: (method: import("ts-morph").MethodSignature, isCborSvc: boolean) => import("..").QueryMethod;
    hasCborParams: (params: readonly Readonly<{
        name: string;
        type: import("..").DataType;
        isOptional: boolean;
    }>[], method: import("ts-morph").MethodSignature, isCborSvc: boolean) => boolean;
    buildImports: (file: SourceFile) => ReadonlyArray<Import>;
};
//# sourceMappingURL=index.d.ts.map