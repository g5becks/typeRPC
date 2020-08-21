import {DataType} from './types'

export type HTTPVerb = 'POST' | 'GET'

export type HttpErrCode = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 |  409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 |  418 | 422 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511

export type HttpResponseCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 |300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308

export type Param = {
  readonly name: string;
  readonly type: DataType;
  readonly isOptional: boolean;
}

export type Method = {
  readonly name: string;
  readonly params:  Param[];
  readonly returnType: DataType;
  // serialize|deserialize params using cbor ?
  readonly hasCborParams:  boolean;
  // serialize|deserialize return type using cbor ?
  readonly hasCborReturn:  boolean;
  // method has parameters ?
  readonly hasParams:  boolean;
  // does method Htt Verb === 'GET'
  readonly isGet: boolean;
  readonly isVoidReturn: boolean;
  // Type Of Http Verb this method uses. E.G. GET, POST, ...
  readonly httpVerb: HTTPVerb;
  // HTTP Response Status code for successful requests
  readonly responseCode: HttpResponseCode;
  // HTTP Response Status code for failed requests
  readonly errorCode: HttpErrCode;

}

export type Property = {
  readonly name: string;
  readonly type: DataType;
  readonly isOptional: boolean;
}

export type Interface = {
  readonly name: string;
  readonly methods: Method[];
}

// TypeAlias from schema file
export type TypeDef = {
  readonly name: string;
  readonly properties: Property[];
}

export type Schema = {
  // Name of the file this schema was generated from
  readonly fileName: string;
  readonly types: TypeDef[];
  readonly interfaces: Interface[];
  readonly hasCbor: boolean;
}
