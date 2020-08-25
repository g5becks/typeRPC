/* eslint-disable new-cap,  @typescript-eslint/no-use-before-define,radix */
// file deepcode ignore semicolon: eslint conflict
import {
  InterfaceDeclaration,
  MethodSignature,
  Node,
  ParameterDeclaration,
  PropertySignature,
  SourceFile,
  TypeNode,
} from 'ts-morph'
import {DataType, is, make, typeError} from './types'
import {Schema} from '.'
import {HTTPErrCode, HTTPResponseCode, HTTPVerb, Service, Method, Param, Property, Message} from './schema'
import {isContainer, isHttpVerb, isMsgLiteral, isValidDataType} from './validator/utils'
import {isErrCode, isResponseCode} from './validator/service'
import {validateSchemas} from './validator'
import {isOptionalProp, parseJsDocComment, parseMessages, parseMsgProps} from './parser'

const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

const makeDataType = (type: TypeNode | Node): DataType => {
  if (!isValidDataType(type)) {
    throw typeError(type)
  }
  const prim = make.primitive(type)
  if (prim) {
    return prim
  }
  if (isMsgLiteral(type)) {
    return make.StructLiteral(type, makeDataType)
  }
  if (!isContainer(type)) {
    return make.Struct(type)
  }
  if (isType(type, '$.List')) {
    return make.List(type, makeDataType)
  }
  if (isType(type, '$.Dict')) {
    return make.Dict(type, makeDataType)
  }
  if (isType(type, '$.Tuple')) {
    return make.Tuple(type, makeDataType)
  }

  return make.dyn
}

// builds the HTTPVerb for a Method Schema using the parsed JsDoc
const buildHttpVerb = (method: MethodSignature): HTTPVerb => {
  const comment = parseJsDocComment(method, 'access') as HTTPVerb ?? 'POST'
  return isHttpVerb(comment) ? comment : 'POST'
}

// builds the HTTPResponseCode for a Method Schema using the parsed JsDoc
const buildResponseCode = (method: MethodSignature): HTTPResponseCode => {
  const comment = parseJsDocComment(method, 'returns')  ?? '200'
  const response = parseInt(comment)
  return isResponseCode(response) ? response as HTTPResponseCode : 200
}

// builds the HTTPErrCode for a Method Schema using the parsed JsDoc
const buildErrCode = (method: MethodSignature): HTTPErrCode => {
  const comment = parseJsDocComment(method, 'throws') ?? '500'
  const response = parseInt(comment)
  return isErrCode(response) ? response as HTTPErrCode : 500
}

// builds all properties of an rpc.Msg
const buildProps = (properties: PropertySignature[]): Property[] =>
  properties.map(prop => {
    return {isOptional: isOptionalProp(prop), type: makeDataType(prop.getTypeNodeOrThrow()), name: prop.getName().trim()}
  })

// Converts all rpc.Msg types in files into Schema Messages
const buildMessages = (file: SourceFile): Message[] => {
  const messages = parseMessages(file)
  if (messages.length === 0) {
    return []
  }

  return [...new Set(messages.map(msg => {
    return {
      name: msg.getNameNode().getText().trim(),
      properties: [...new Set(buildProps(parseMsgProps(msg)))]}
  }))]
}

const buildParams = (params: ParameterDeclaration[]): Param[] => {
  return [...new Set<Param>(params.map(param => {
    return {
      name: param.getName().trim(),
      isOptional: param.isOptional(),
      type: makeDataType(param.getTypeNode()!),
    }
  }))]
}

const getMethodName = (method: MethodSignature): string => method.getNameNode().getText().trim()

const buildMethod = (method: MethodSignature): Method => {
  return {
    httpVerb: buildHttpVerb(method),
    name: getMethodName(method),
    params: buildParams(method.getParameters()),
    returnType: makeDataType(method.getReturnTypeNode()!),
    responseCode: buildResponseCode(method),
    errorCode: buildErrCode(method),
    get isVoidReturn(): boolean {
      // noinspection JSDeepBugsBinOperand
      return this.returnType === make.unit
    },
    get isGet(): boolean {
      return this.httpVerb.toUpperCase() === 'GET'
    },
    get hasCborParams(): boolean {
      return [...this.params].some(param => is.Struct(param.type) && param.type.useCbor)
    },
    get hasCborReturn(): boolean {
      return is.Struct(this.returnType) && this.returnType.useCbor
    },
    get hasParams(): boolean {
      return this.params.length > 0
    },
  }
}

const buildMethods = (methods: MethodSignature[]): Method[] => [...new Set(methods.map(method => buildMethod(method)))]

export const getInterfaceName = (interfc: InterfaceDeclaration): string => interfc.getNameNode().getText().trim()

const buildInterface = (interfc: InterfaceDeclaration): Service => {
  return {
    name: getInterfaceName(interfc),
    methods: buildMethods(interfc.getMethods()),
  }
}

const buildInterfaces = (sourceFile: SourceFile): Service[] => {
  const interfaces = sourceFile.getInterfaces()
  if (interfaces.length === 0) {
    return []
  }
  return [...new Set(interfaces.map(interfc => buildInterface(interfc)))]
}

const buildSchema = (file: SourceFile): Schema => {
  return {
    fileName: file.getBaseNameWithoutExtension(),
    messages: buildMessages(file),
    services: buildInterfaces(file),
    get hasCbor(): boolean {
      return this.services.flatMap(interfc => [...interfc.methods]).some(method => method.hasCborParams || method.hasCborReturn)
    },
  }
}

export const buildSchemas = (sourceFiles: SourceFile[]): Schema[] | Error[] => {
  const errs = validateSchemas(sourceFiles)
  return errs ? errs : [...new Set<Schema>(sourceFiles.map(file => buildSchema(file)))]
}

export const internalTesting = {
  isType,
  useCbor,
  buildSchema,
  buildMethod,
  buildParams,
  buildProps,
  buildTypes: buildMessages,
  buildHttpVerb,
  buildErrCode,
  buildResponseCode,
  makeDataType,
}
