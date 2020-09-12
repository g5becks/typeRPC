import { internal as _ } from '@typerpc/types';
export declare type Struct = Readonly<{
    name: string;
    useCbor: boolean;
    toString(): string;
}> & {
    readonly brand: unique symbol;
};
export declare type StructLiteralProp = Readonly<{
    name: string;
    type: DataType;
    isOptional: boolean;
    toString(): string;
}>;
export declare type StructLiteral = Readonly<{
    properties: ReadonlyArray<StructLiteralProp>;
    toString(): string;
}>;
export declare const structLiteralProp: (name: string, type: DataType, isOptional: boolean) => StructLiteralProp;
export declare const scalars: string[];
export declare const scalarsMap: Map<string, _.Scalar>;
export declare const containers: string[];
export declare const queryParamables: string[];
export declare type DataType = _.RpcType | Struct | StructLiteral;
//# sourceMappingURL=data-type.d.ts.map