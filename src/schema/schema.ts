import {DataType} from './types'

export type HTTPVerb = 'POST' | 'PUT' | 'GET' | 'HEAD' | 'DELETE' | 'OPTIONS' | 'PATCH'

export type Param = {
  readonly name: string;
  readonly type: DataType;
  readonly isOptional: boolean;
}

export type Method = {
  readonly httpVerb: HTTPVerb;
  readonly params:  Param[];
  readonly returnType: DataType;
}

export type Property = {
  readonly name: string;
  readonly type: DataType;
  readonly isOptional: boolean;
}

export type Interface = {
  readonly methods: Set<Method>;
}

// TypeAlias from schema file
export type TypeDef = {
  readonly properties: ReadonlySet<Property>;
  // If this type should be serialized/deserialized using cbor instead of json
  readonly isBinary: boolean;
}

export type Schema = {
  // Name of the file this schema was generated from
  readonly fileName: string;
  readonly types: ReadonlySet<TypeDef>;
  readonly interfaces: ReadonlySet<Interface>;
}
