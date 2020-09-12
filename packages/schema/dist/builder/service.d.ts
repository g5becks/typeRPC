import { MethodSignature, ParameterDeclaration, SourceFile } from 'ts-morph';
import { HTTPErrCode, HTTPResponseCode, Method, MutationMethod, MutationService, Param, QueryMethod, QueryService } from '../schema';
export declare const buildResponseCode: (method: MethodSignature) => HTTPResponseCode;
export declare const buildErrCode: (method: MethodSignature) => HTTPErrCode;
export declare const buildParams: (params: ParameterDeclaration[]) => Param[];
export declare const hasCborParams: (params: ReadonlyArray<Param>, method: MethodSignature, isCborSvc: boolean) => boolean;
export declare const buildMethod: (method: MethodSignature, isCborSvc: boolean) => Method;
export declare const buildQueryMethod: (method: MethodSignature, isCborSvc: boolean) => QueryMethod;
export declare const buildMutationMethod: (method: MethodSignature, isCborSvc: boolean) => MutationMethod;
export declare const buildQueryServices: (file: SourceFile) => QueryService[];
export declare const buildMutationServices: (file: SourceFile) => MutationService[];
//# sourceMappingURL=service.d.ts.map