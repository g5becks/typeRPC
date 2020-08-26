import {MethodSignature, Node, SourceFile, TypeAliasDeclaration, TypeNode} from 'ts-morph'
import {DataType, make, typeError} from '../types'
import {isContainer, isMsgLiteral, isValidDataType} from '../validator'
import {parseJsDocComment} from '../parser'

export const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

export const makeDataType = (type: TypeNode | Node, projectFiles: SourceFile[]): DataType => {
  if (!isValidDataType(type, projectFiles)) {
    throw typeError(type)
  }
  const prim = make.primitive(type)
  if (prim) {
    return prim
  }
  if (isMsgLiteral(type)) {
    return make.StructLiteral(type, projectFiles, makeDataType)
  }
  if (!isContainer(type)) {
    return make.Struct(type)
  }
  if (isType(type, '$.List')) {
    return make.List(type, projectFiles, makeDataType)
  }
  if (isType(type, '$.Dict')) {
    return make.Dict(type, projectFiles, makeDataType)
  }
  if (isType(type, '$.Tuple')) {
    return make.Tuple(type, projectFiles, makeDataType)
  }

  return make.dyn
}
// Determines if the generated type or method should use cbor for serialization/deserialization
// based on the JsDoc @kind tag
export const useCbor = (type: TypeAliasDeclaration | MethodSignature): boolean => {
  const comment = parseJsDocComment(type, 'kind')?.trim().toLowerCase() ?? ''
  return comment.includes('cbor')
}
