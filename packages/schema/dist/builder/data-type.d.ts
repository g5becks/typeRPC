import { MethodSignature, Node, TypeAliasDeclaration, TypeNode } from 'ts-morph';
import { DataType } from '../index';
export declare const isType: (type: TypeNode | Node, typeText: string) => boolean;
export declare const makeDataType: (type: TypeNode | Node) => DataType;
export declare const useCbor: (type: TypeAliasDeclaration | MethodSignature | undefined) => boolean;
//# sourceMappingURL=data-type.d.ts.map