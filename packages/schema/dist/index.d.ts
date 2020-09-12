import { containers, DataType, queryParamables, scalars, Struct, StructLiteral, StructLiteralProp } from './data-type';
import { make, typeError } from './make';
import { is } from './is';
import { buildSchemas } from './builder';
import { validateSchemas } from './validator';
import { HTTPErrCode, HTTPResponseCode, Import, isMutationMethod, isMutationSvc, isQueryMethod, isQuerySvc, Message, Method, MutationMethod, MutationService, Param, Property, QueryMethod, QueryService, Schema } from './schema';
export { buildSchemas, validateSchemas, Import, isMutationSvc, isMutationMethod, isQueryMethod, isQuerySvc, Message, Method, MutationMethod, MutationService, Param, Property, HTTPResponseCode, HTTPErrCode, QueryService, QueryMethod, Schema, DataType, make, is, typeError, StructLiteral, Struct, StructLiteralProp, queryParamables, scalars, containers, };
export declare const _testing: {
    parseMsgProps: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeAliasDeclaration | import("ts-morph").TypeNode<import("typescript").TypeNode>) => import("ts-morph").PropertySignature[];
    parseMessages: (file: import("ts-morph").SourceFile) => import("ts-morph").TypeAliasDeclaration[];
    parseMutationServices: (file: import("ts-morph").SourceFile) => import("ts-morph").TypeAliasDeclaration[];
    parseQueryServices: (file: import("ts-morph").SourceFile) => import("ts-morph").TypeAliasDeclaration[];
    isOptionalProp: (prop: import("ts-morph").PropertySignature) => boolean;
    parseServiceMethods: (type: import("ts-morph").TypeAliasDeclaration) => import("ts-morph").MethodSignature[];
    validateMessage: (msg: import("ts-morph").TypeAliasDeclaration | import("ts-morph").TypeNode<import("typescript").TypeNode>) => Error[];
    isValidMsg: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode>) => boolean;
    isValidDataType: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode> | undefined) => boolean;
    isScalar: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode>) => boolean;
    validateService: (service: import("ts-morph").TypeAliasDeclaration) => Error[];
    validateNotGeneric: (type: import("ts-morph").MethodSignature | import("ts-morph").TypeAliasDeclaration) => Error[];
    validateReturnType: (method: import("ts-morph").MethodSignature) => Error[];
    validateMethodJsDoc: (method: import("ts-morph").MethodSignature) => Error[];
    validateQueryMethodParams: (method: import("ts-morph").MethodSignature) => Error[];
    validateTypes: (file: import("ts-morph").SourceFile) => Error[];
    validateJsDoc: (type: import("ts-morph").TypeAliasDeclaration) => Error[];
    validateExports: (file: import("ts-morph").SourceFile) => Error[];
    validateImports: (file: import("ts-morph").SourceFile, projectFiles: import("ts-morph").SourceFile[]) => Error[];
    validateEnums: (file: import("ts-morph").SourceFile) => Error[];
    validateNameSpaces: (file: import("ts-morph").SourceFile) => Error[];
    validateClasses: (file: import("ts-morph").SourceFile) => Error[];
    validateStatements: (file: import("ts-morph").SourceFile) => Error[];
    validateVariables: (file: import("ts-morph").SourceFile) => Error[];
    validateInterfaces: (file: import("ts-morph").SourceFile) => Error[];
    validateFunctions: (file: import("ts-morph").SourceFile) => Error[];
    validateMessages: (file: import("ts-morph").SourceFile) => Error[];
    useCbor: (type: import("ts-morph").MethodSignature | import("ts-morph").TypeAliasDeclaration | undefined) => boolean;
    isType: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode>, typeText: string) => boolean;
    buildSchema: (file: import("ts-morph").SourceFile, packageName: string) => Readonly<{
        packageName: string;
        fileName: string;
        imports: readonly Readonly<{
            messageNames: readonly string[];
            fileName: string;
        }>[];
        messages: readonly Readonly<{
            name: string;
            properties: readonly Readonly<{
                name: string;
                type: DataType;
                isOptional: boolean;
            }>[];
        }>[];
        queryServices: readonly Readonly<{
            type: "QueryService";
            name: string;
            methods: readonly QueryMethod[];
            useCbor: boolean;
        }>[];
        mutationServices: readonly Readonly<{
            type: "MutationService";
            name: string;
            methods: readonly MutationMethod[];
            useCbor: boolean;
        }>[];
        hasCbor: boolean;
    }>;
    buildParams: (params: import("ts-morph").ParameterDeclaration[]) => Readonly<{
        name: string;
        type: DataType;
        isOptional: boolean;
    }>[];
    buildMessages: (file: import("ts-morph").SourceFile) => Readonly<{
        name: string;
        properties: readonly Readonly<{
            name: string;
            type: DataType;
            isOptional: boolean;
        }>[];
    }>[];
    buildErrCode: (method: import("ts-morph").MethodSignature) => HTTPErrCode;
    buildResponseCode: (method: import("ts-morph").MethodSignature) => HTTPResponseCode;
    makeDataType: (type: import("ts-morph").Node<import("typescript").Node> | import("ts-morph").TypeNode<import("typescript").TypeNode>) => DataType;
    buildMutationMethod: (method: import("ts-morph").MethodSignature, isCborSvc: boolean) => MutationMethod;
    buildMethod: (method: import("ts-morph").MethodSignature, isCborSvc: boolean) => Method;
    buildQueryMethod: (method: import("ts-morph").MethodSignature, isCborSvc: boolean) => QueryMethod;
    hasCborParams: (params: readonly Readonly<{
        name: string;
        type: DataType;
        isOptional: boolean;
    }>[], method: import("ts-morph").MethodSignature, isCborSvc: boolean) => boolean;
    buildImports: (file: import("ts-morph").SourceFile) => readonly Readonly<{
        messageNames: readonly string[];
        fileName: string;
    }>[];
};
//# sourceMappingURL=index.d.ts.map