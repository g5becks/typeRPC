import { DataType, Struct } from './data-type';
import { $, internal as x } from '@typerpc/types';
export declare const is: {
    map: (type: unknown) => type is $.map<$.str, x.Paramable>;
    tuple2: (type: unknown) => type is $.tuple2<x.Paramable, x.Paramable>;
    tuple3: (type: unknown) => type is $.tuple3<x.Paramable, x.Paramable, x.Paramable>;
    tuple4: (type: unknown) => type is $.tuple4<x.Paramable, x.Paramable, x.Paramable, x.Paramable>;
    tuple5: (type: unknown) => type is $.tuple5<x.Paramable, x.Paramable, x.Paramable, x.Paramable, x.Paramable>;
    list: (type: unknown) => type is $.list<x.Paramable>;
    struct: (type: unknown) => type is Struct;
    structLiteral: (type: unknown) => type is Readonly<{
        properties: readonly Readonly<{
            name: string;
            type: DataType;
            isOptional: boolean;
            toString(): string;
        }>[];
        toString(): string;
    }>;
    container: (type: unknown) => boolean;
    queryParamable: (type: DataType) => boolean;
    scalar: (type: any) => type is x.Scalar;
    dataType: (type: any) => type is DataType;
};
//# sourceMappingURL=is.d.ts.map