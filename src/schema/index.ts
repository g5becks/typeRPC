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

import {
  isOptionalProp,
  parseMessages,
  parseMsgProps,
  parseMutationServices,
  parseQueryServices,
  parseServiceMethods,
} from './parser'

import {internal, validateSchemas} from './validator'

export {buildSchemas, Schema, make, DataType, is, Import, QueryService, Message, Param, Property, MutationMethod, Struct, StructLiteral, StructLiteralProp, scalars, containers, queryParamables, validateSchemas}

export const testing = {
  ...internalTesting,
  ...internal,
  parseMsgProps,
  isOptionalProp,
  parseServiceMethods,
  parseQueryServices,
  parseMutationServices,
  parseMessages,
}
