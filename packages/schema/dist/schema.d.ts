import { DataType } from './data-type';
declare type HttpMethod = 'GET' | 'POST';
export declare type HTTPErrCode = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 422 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;
export declare type HTTPResponseCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308;
/** A single Method parameter */
export declare type Param = Readonly<{
    /** the name of the parameter */
    name: string;
    /** the parameter's dataType */
    type: DataType;
    /** whether or not this parameter is option */
    isOptional: boolean;
}>;
export interface Method {
    /** the name of the method */
    readonly name: string;
    /** the method's parameters */
    readonly params: ReadonlyArray<Param>;
    /** the method's return type */
    readonly returnType: DataType;
    /**
     * If the method's return type is an rpc.Msg and was annotated with the
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
     */
    readonly httpMethod: HttpMethod;
    /**
     *  The HTTPResponseCode to send back to the client upon success.
     *
     *  If there was a valid @returns JsDoc tag found
     * on the method's Schema, it will be set to that,
     * otherwise, the default status of 200 is used.
     * */
    readonly responseCode: HTTPResponseCode;
    /**
     * The HTTPErrCode to send back to the client upon failure.
     *
     * If there was a valid @throws JsDoc tag found on the
     * method's Schema, it will be set to that, otherwise,
     * the the default value of 500 is used
     */
    readonly errorCode: HTTPErrCode;
    /** Getter method the tells if this method has params or not. */
    readonly hasParams: boolean;
    /** Getter method that tells if this method returns a value or not. */
    readonly isVoidReturn: boolean;
}
/** A Method that belongs to an rpc.QuerySvc */
export interface QueryMethod extends Method {
    readonly httpMethod: 'GET';
}
/** A Method that belongs to an rpc.MutationSvc */
export interface MutationMethod extends Method {
    readonly httpMethod: 'POST';
    /**
     * If any of the method's parameters are an rpc.Msg that were annotated
     * with the '@kind cbor' JsDoc tag this will be true
     * and all of the params have to be serialized/deserialized using cbor
     * this will also return true if the '@kind cbor' tag
     * was used at either the service or method level
     */
    readonly hasCborParams: boolean;
}
/** An rpc.QuerySvc */
export declare type QueryService = Readonly<{
    type: 'QueryService';
    name: string;
    methods: ReadonlyArray<QueryMethod>;
    /**
     * If this service's  Schema was annotated with
     * a valid @kind JsDoc tag, this will be true and
     * cause the hasCborReturn property for all of this service's
     * methods to return true.
     */
    useCbor: boolean;
}>;
export declare const isMutationSvc: (svc: any) => svc is Readonly<{
    type: 'MutationService';
    name: string;
    methods: ReadonlyArray<MutationMethod>;
    /**
     * If this service's  Schema was annotated with
     * a valid @kind JsDoc tag, this will be true and
     * cause the hasCborParams and hasCborReturn properties
     * for all of this service's methods to return true.
     */
    useCbor: boolean;
}>;
export declare const isQuerySvc: (svc: any) => svc is Readonly<{
    type: 'QueryService';
    name: string;
    methods: ReadonlyArray<QueryMethod>;
    /**
     * If this service's  Schema was annotated with
     * a valid @kind JsDoc tag, this will be true and
     * cause the hasCborReturn property for all of this service's
     * methods to return true.
     */
    useCbor: boolean;
}>;
export declare const isMutationMethod: (method: any) => method is MutationMethod;
export declare const isQueryMethod: (method: any) => method is QueryMethod;
/** An rpc.MutationSvc */
export declare type MutationService = Readonly<{
    type: 'MutationService';
    name: string;
    methods: ReadonlyArray<MutationMethod>;
    /**
     * If this service's  Schema was annotated with
     * a valid @kind JsDoc tag, this will be true and
     * cause the hasCborParams and hasCborReturn properties
     * for all of this service's methods to return true.
     */
    useCbor: boolean;
}>;
/** A Property that Belongs to an rpc.Msg */
export declare type Property = Readonly<{
    /** The name of this property */
    name: string;
    /** The property's dataType */
    type: DataType;
    /** Whether or not this Property is optional */
    isOptional: boolean;
}>;
/** An rpc.Msg location schema file */
export declare type Message = Readonly<{
    /** The name of the type */
    name: string;
    properties: ReadonlyArray<Property>;
}>;
/** An import declaration found in a Schema file */
export declare type Import = Readonly<{
    /** The names of the Messages that were imported */
    messageNames: ReadonlyArray<string>;
    /** The name of the file the messageNames were imported location */
    fileName: string;
}>;
/** A Schema used to generate server and client code */
export declare type Schema = Readonly<{
    /** name of the package to use when generating code **/
    packageName: string;
    /** Name of the file this schema was generated location without extension.  */
    fileName: string;
    /** All of the imports found in the file */
    imports: ReadonlyArray<Import>;
    /** All Messages to be converted to Types/Classes for this file. */
    messages: ReadonlyArray<Message>;
    /** All rpc.QuerySvc's to be generated for this file */
    queryServices: ReadonlyArray<QueryService>;
    /** All rpc.MutationSvc's to be generated for this file */
    mutationServices: ReadonlyArray<MutationService>;
    /**
     *  Determines whether or not this Schema file has any method's, Messages,
     *  or Services that have an @kind cbor annotation.
     *  This is used during code generation to determine whether or not any
     *  cbor library or package should be imported.
     */
    hasCbor: boolean;
}>;
export {};
//# sourceMappingURL=schema.d.ts.map