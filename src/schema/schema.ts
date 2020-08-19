import {DataType} from './types'

export type HTTPVerb = 'POST' | 'PUT' | 'GET' | 'HEAD' | 'DELETE' | 'OPTIONS' | 'PATCH'
export type ClientErrCode = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 |  409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 |  418 | 422 | 425 | 426 | 428 | 429 | 431 | 451

export type ServerErrCode = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511

export type HttpErrCode = ClientErrCode & ServerErrCode

export type SuccessCode = 200 | 201 | 202 | 203 | 204 | 205 | 206
export type RedirectCode = 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
export type ResponseCode = SuccessCode & RedirectCode

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
  readonly responseCode?: ResponseCode;
  readonly errorCode?: HttpErrCode;

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
