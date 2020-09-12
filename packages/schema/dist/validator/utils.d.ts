import { MethodSignature, Node, ParameterDeclaration, PropertySignature, SourceFile, TypeAliasDeclaration, TypeNode } from 'ts-morph';
export declare const isScalar: (type: TypeNode | Node) => boolean;
export declare const isContainer: (type: TypeNode | Node) => boolean;
export declare const isMsg: (type: TypeAliasDeclaration | PropertySignature | ParameterDeclaration) => boolean;
export declare const isQuerySvc: (type: TypeAliasDeclaration) => boolean;
export declare const isMutationSvc: (type: TypeAliasDeclaration) => boolean;
export declare const isValidMsg: (type: TypeNode | Node) => boolean;
interface GetNameViolator {
    getName(): string | undefined;
    getStartLineNumber(includeJsDocComments?: boolean): number;
    getKindName(): string;
    getSourceFile(): SourceFile;
}
interface GetTextViolator {
    getText(includeJsDocComments?: boolean): string;
    getStartLineNumber(includeJsDocComments?: boolean): number;
    getKindName(): string;
    getSourceFile(): SourceFile;
}
export declare type Violator = GetNameViolator | GetTextViolator;
export declare const multiValidationErr: (violators: Violator[]) => Error;
export declare const singleValidationErr: (node: Node | undefined, msg: string) => Error;
export declare const validateNotGeneric: (type: TypeAliasDeclaration | MethodSignature) => Error[];
export declare const isMsgLiteral: (type: TypeNode | Node) => boolean;
export declare const isValidDataType: (type: TypeNode | Node | undefined) => boolean;
export {};
//# sourceMappingURL=utils.d.ts.map