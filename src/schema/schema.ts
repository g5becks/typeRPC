import {DataType} from './types'

export type HTTPVerb = 'POST' | 'PUT' | 'GET' | 'HEAD' | 'DELETE' | 'OPTIONS' | 'PATCH'

export type Param = {
  readonly name: string;
  readonly type: DataType;
  readonly isOptional: boolean;
}

export type Method = {
  readonly httpVerb: HTTPVerb;
  readonly name: string;
  readonly params:  ReadonlySet<Param>;
  readonly returnType: DataType;
  // serialize|deserialize params using cbor ?
  readonly cborParams:  boolean;
  // serialize|deserialize return type using cbor ?
  readonly cborReturn:  boolean;
  // method has parameters ?
  readonly hasParams:  boolean;
}

export type Property = {
  readonly name: string;
  readonly type: DataType;
  readonly isOptional: boolean;
}

export type Interface = {
  readonly name: string;
  readonly methods: ReadonlySet<Method>;
}

// TypeAlias from schema file
export type TypeDef = {
  readonly name: string;
  readonly properties: ReadonlySet<Property>;
}

export type Schema = {
  // Name of the file this schema was generated from
  readonly fileName: string;
  readonly types: ReadonlySet<TypeDef>;
  readonly interfaces: ReadonlySet<Interface>;
  readonly hasCbor: boolean;
}
