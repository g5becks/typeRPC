import { MethodSignature, Node, PropertySignature, SourceFile, TypeAliasDeclaration, TypeNode, TypeReferenceNode } from 'ts-morph';
export declare const isOptionalProp: (prop: PropertySignature) => boolean;
export declare const parseMsgProps: (type: TypeAliasDeclaration | TypeNode | Node) => PropertySignature[];
export declare const parseNamedImports: (file: SourceFile) => string[];
export declare const parseTypeParams: (type: Node | TypeNode) => TypeReferenceNode[];
export declare const parseJsDocComment: (method: MethodSignature | TypeAliasDeclaration, tagName: string) => string | undefined;
export declare const parseMessages: (file: SourceFile) => TypeAliasDeclaration[];
export declare const parseQueryServices: (file: SourceFile) => TypeAliasDeclaration[];
export declare const parseMutationServices: (file: SourceFile) => TypeAliasDeclaration[];
export declare const parseServiceMethods: (type: TypeAliasDeclaration) => MethodSignature[];
//# sourceMappingURL=index.d.ts.map