import {Import, Message, MutationMethod, Param, Property, QueryService, Schema} from './schema'
import {
  containers,
  DataType,
  is,
  make,
  queryParamables,
  scalars,
  Struct,
  StructLiteral,
  StructLiteralProp,
} from './types'
import {buildSchemas, internalTesting} from './builder'

import {parseMsgProps, isOptionalProp, parseServiceMethods, parseMutationServices, parseQueryServices, parseMessages} from './parser'

export {buildSchemas, Schema, make, DataType, is, Import, QueryService, Message, Param, Property, MutationMethod, Struct, StructLiteral, StructLiteralProp, scalars, containers, queryParamables}

export const testing = {
  ...internalTesting,
  parseMsgProps,
  isOptionalProp,
  parseServiceMethods,
  parseQueryServices,
  parseMutationServices,
  parseMessages,
}
