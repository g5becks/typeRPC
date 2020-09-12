import { MethodSignature, SourceFile, TypeAliasDeclaration } from 'ts-morph';
import { HTTPErrCode, HTTPResponseCode } from '../index';
export declare const errCodes: number[];
export declare const responseCodes: number[];
export declare const isResponseCode: (code: number | undefined) => code is HTTPResponseCode;
export declare const isErrCode: (code: number | undefined) => code is HTTPErrCode;
export declare const validateServices: (file: SourceFile) => Error[];
export declare const serviceValidatorTesting: {
    validateService: (service: TypeAliasDeclaration) => Error[];
    validateNotGeneric: (type: MethodSignature | TypeAliasDeclaration) => Error[];
    validateReturnType: (method: MethodSignature) => Error[];
    validateMethodJsDoc: (method: MethodSignature) => Error[];
    validateQueryMethodParams: (method: MethodSignature) => Error[];
};
//# sourceMappingURL=service.d.ts.map