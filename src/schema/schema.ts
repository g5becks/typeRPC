import {DataType} from './types/data-type'

type HttpMethod = 'GET' | 'POST'

export type HTTPErrCode = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 |  409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 |  418 | 422 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511

export type HTTPResponseCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 |300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308

export type Param = Readonly<{
  name: string;
  type: DataType;
  isOptional: boolean;
}>

interface Method {
  /** the name of the method */
 readonly name: string;
  /** the method's parameters */
 readonly params: ReadonlyArray<Param>;
  /** the method's return type */
 readonly returnType: DataType;
  /**
   * if the method's return type is an rpc.Msg and was annotated with the
   * '@kind cbor' JsDoc tag this will be true and this
   * method's return type should be serialized/deserialized
   * using cbor. This will also return true if the '@kind cbor' tag
   * was used at either the service or method level
   */
 readonly hasCborReturn: boolean;
  /**
   * HTTP Method for this method to use for sending and receiving requests
   *
   * Set to 'GET' for rpc.QuerySvc methods
   * and 'POST' for rpc.MutationSvc methods
   *
   */
 readonly httpMethod: HttpMethod;
}

export type MutationMethod = Readonly<{
  /** the name of the method */
  name: string;
  params:  ReadonlyArray<Param>;
  returnType: DataType;
  /**
   * If any of the method's parameters are an rpc.Msg that were annotated
  * with the '@kind cbor' JsDoc tag this will be true
  * and all of the params have to be serialized/deserialized using cbor
  * this will also return true if the '@kind cbor' tag
  * was used at either the service or method level
   */
  hasCborParams:  boolean;
  // if the method's return type is an rpc.Msg and was annotated with the
  // '@kind cbor' JsDoc tag this will be true and this
  // method's return type should be serialized/deserialized
  // using cbor. This will also return true if the '@kind cbor' tag
  // was used at either the service or method level
  hasCborReturn:  boolean;
  // method has parameters ?
  hasParams:  boolean;
  isVoidReturn: boolean;
  httpMethod: 'POST';
  // HTTP Response Status code for successful requests
  responseCode: HTTPResponseCode;
  // HTTP Response Status code for failed requests
  errorCode: HTTPErrCode;
}>

export type Property = Readonly<{
  name: string;
  type: DataType;
  isOptional: boolean;
}>

export type QueryService = Readonly<{
  type: 'QueryService';
  name: string;
  methods: ReadonlyArray<MutationMethod>;
  // If true, use CBOR instead of Json for all param
  // and return type of all this service's methods.
  useCbor: boolean;
}>

export type MutationService = Readonly<{
  type: 'MutationService';
  name: string;
  methods: ReadonlyArray<MutationMethod>;
  // If true, use CBOR instead of Json for all param
  // and return type of all this service's methods.
  useCbor: boolean;
}>
// rpc.Msg from schema file
export type Message = Readonly<{
  name: string;
  isExported: boolean;
  properties: ReadonlyArray<Property>;
}>

export type Import = Readonly<{
    // names of imported messages
    messageNames: ReadonlyArray<string>;
    // name of the file the import is from
    fileName: string;
}>
export type Schema = Readonly<{
  // Name of the file this schema was generated from without extension.
  fileName: string;
  imports: ReadonlyArray<Import>;
  messages: ReadonlyArray<Message>;
  queryServices: ReadonlyArray<QueryService>;
  mutationServices: ReadonlyArray<MutationService>;
  hasCbor: boolean;
}>
