import { SourceFile, TypeAliasDeclaration } from 'ts-morph';
export declare const validateDeclarations: (file: SourceFile, projectFiles: SourceFile[]) => Error[];
export declare const internal: {
    validateTypes: (file: SourceFile) => Error[];
    validateJsDoc: (type: TypeAliasDeclaration) => Error[];
    validateExports: (file: SourceFile) => Error[];
    validateImports: (file: SourceFile, projectFiles: SourceFile[]) => Error[];
    validateEnums: (file: SourceFile) => Error[];
    validateNameSpaces: (file: SourceFile) => Error[];
    validateClasses: (file: SourceFile) => Error[];
    validateStatements: (file: SourceFile) => Error[];
    validateVariables: (file: SourceFile) => Error[];
    validateInterfaces: (file: SourceFile) => Error[];
    validateFunctions: (file: SourceFile) => Error[];
    validateMessages: (file: SourceFile) => Error[];
};
//# sourceMappingURL=declarations.d.ts.map