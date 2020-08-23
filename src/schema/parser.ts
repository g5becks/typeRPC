/* eslint-disable radix */
// file deepcode ignore semicolon: conflicts with eslint settings
// file deepcode ignore interface-over-type-literal: improper
import {
  MethodSignature,
  Node,
  ParameterDeclaration,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph'
import {
  containersList,
  isQueryParamableString,
  primitivesMap,
  queryParamableContainers,
  queryParamablePrims,
} from './types'
import {getJsDocComment, getTypeNode} from './builder'
import {HTTPErrCode, HTTPResponseCode, HTTPVerb} from './schema'

// Valid HTTP Error status codes
const errCodes = [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 422, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]

// Valid HTTP success status codes
const responseCodes = [200, 201, 202, 203, 204, 205, 206, 300, 301, 302, 303, 304, 305, 306, 307, 308]

// is the type found is a typerpc primitive type?
export const isPrimitive = (typeText: string): boolean => primitivesMap.has(typeText.trim())

// is the type found a typerpc container type?
export const isContainer = (typeText: string): boolean => containersList.some(container => typeText.trim().startsWith(container))

// is the type found a valid typerpc type?
const isValidDataType = (typeText: string): boolean => isPrimitive(typeText) || isContainer(typeText)

// is the type alias an rpc.Msg?
const isMsg = (type: TypeAliasDeclaration): boolean => Boolean(type.getTypeNode()?.getText().startsWith('rpc.Msg<{'))

// is the type alias an rpc.Service?
const isService = (type: TypeAliasDeclaration): boolean => Boolean(type.getTypeNode()?.getText().startsWith('rpc.Service<{'))

// is the type alias used as a property or parameter a type alias defined in this
// schema file?
const isValidTypeAlias = (type: TypeNode | Node): boolean => type.getSourceFile().getTypeAliases().map(alias => alias.getNameNode().getText().trim()).includes(type.getText().trim())

// is the http verb used in the JsDoc @access tag a valid typerpc HTTPVerb?
export const isHttpVerb = (method: string | undefined): method is HTTPVerb =>
  ['POST', 'GET'].includes(method ?? '')

// is the number used in the JsDoc @returns tag a valid typerpc HTTPResponseCode?
export const isResponseCode = (code: number| undefined): code is HTTPResponseCode => responseCodes.includes(code ?? 0)

// is the number used in the JsDoc @throws tag a valid typerpc HTTPErrCode?
export const isErrCode = (code: number | undefined): code is HTTPErrCode => errCodes.includes(code ?? 0)

const getServices = (file: SourceFile): TypeAliasDeclaration[] =>
  file.getTypeAliases().filter(alias => isService(alias))

// A ts-morph declaration found in a schema file that has a getName() method
// E.G. FunctionDeclaration, VariableDeclaration
interface GetNameViolator {
  getName(): string | undefined;
  getStartLineNumber(includeJsDocComments?: boolean): number;
  getKindName(): string;
  getSourceFile(): SourceFile;
}

const canGetName = (type: Violator): type is GetNameViolator => 'getName' in type
// A ts-morph declaration found in a schema that does not have a getName() method
// but does have a getText() method
interface GetTextViolator {
  getText(includeJsDocComments?: boolean): string;
  getStartLineNumber(includeJsDocComments?: boolean): number;
  getKindName(): string;
  getSourceFile(): SourceFile;
}
// Anything that is not a type alias is a violator
type Violator = GetNameViolator | GetTextViolator

// Returns a detailed error message about number of schema violations
const multiValidationErr = (violators: Violator[]): Error =>
  new Error(`${violators[0].getSourceFile().getFilePath()?.toString()} contains ${violators.length} ${violators[0].getKindName()} declarations
   errors: ${violators.map(vio =>  canGetName(vio) ?  vio.getName()?.trim() : vio.getText().trim() + ', at line number: ' + String(vio?.getStartLineNumber()) + '\n')}
   message: typerpc schemas can only contain a single import statement (import {t} from '@typerpc/types'), typeAlias (message), and interface (service) declarations.`)

// Returns an error about a single schema violation
const singleValidationErr = (node: Node | undefined, msg: string): Error => {
  return new Error(
    `error in file: ${node?.getSourceFile()?.getFilePath()}
     at line number: ${node?.getStartLineNumber()}
     message: ${msg}`)
}

const validateDeclarations = (declarations: Violator[]): Error[] => declarations.length > 0 ? [multiValidationErr(declarations)] : []

// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => validateDeclarations(sourceFile.getFunctions())

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => validateDeclarations(sourceFile.getVariableDeclarations())

// Ensure Zero Interfaces
const validateInterfaces = (sourceFile: SourceFile): Error[] => validateDeclarations(sourceFile.getInterfaces())

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => validateDeclarations(sourceFile.getClasses())

// Ensure only one valid import without aliasing namespaces
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0]?.getImportClause()?.getNamedImports()[0].getText().trim()
  const errs: Error[] = []
  if (imports.length !== 1) {
    errs.push(singleValidationErr(sourceFile, "typerpc schema files must contain only one import declaration => import {t} from '@typerpc/types"))
  } else if (imports[0].getImportClause()?.getNamedImports()[0].getText().trim() !== 't') {
    errs.push(singleValidationErr(sourceFile, `Invalid import statement => ${imp}, @typerpc/types namespace can only be imported as {t}`))
  }
  return errs
}

// Ensure zero exports
const validateExports = (sourceFile: SourceFile): Error[] => {
  return [...validateDeclarations(sourceFile.getExportAssignments()), ...validateDeclarations(sourceFile.getExportDeclarations())]
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => validateDeclarations(sourceFile.getNamespaces())

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  const invalidKinds = [SyntaxKind.AbstractKeyword, SyntaxKind.AwaitExpression, SyntaxKind.ArrayType, SyntaxKind.ArrowFunction,  SyntaxKind.TaggedTemplateExpression, SyntaxKind.SpreadAssignment, SyntaxKind.JsxExpression, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.SwitchStatement, SyntaxKind.LessThanLessThanEqualsToken]
  const invalids = stmnts.filter(stmnt => invalidKinds.includes(stmnt.getKind()))
  return invalids.length > 0 ? [multiValidationErr(invalids)] : []
}

// Ensure zero enums
const validateEnums = (sourceFile: SourceFile): Error[] => validateDeclarations(sourceFile.getEnums())

// Ensure zero references to other files
const validateRefs = (sourceFile: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = sourceFile.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(multiValidationErr(nodeSourceRefs))
  }
  // should be 1
  const literalSourceRefs = sourceFile.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(multiValidationErr(literalSourceRefs))
  }
  // should be 1
  const sourceRefs = sourceFile.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(multiValidationErr(sourceRefs))
  }
  const otherErr = (msg: string) => new Error(`error in file: ${sourceFile.getFilePath().toString()
  }
  message: ${msg}`)
  // should be 0
  const libraryRefs = sourceFile.getLibReferenceDirectives()
  if (libraryRefs.length > 0) {
    errs.push(otherErr('library reference found'))
  }
  // should be 0
  const pathRefs = sourceFile.getPathReferenceDirectives()
  if (pathRefs.length > 0) {
    errs.push(otherErr('path reference found'))
  }
  // should be 0
  const typeDirRefs = sourceFile.getTypeReferenceDirectives()
  if (typeDirRefs.length > 0) {
    errs.push(otherErr('type directive reference found'))
  }
  return errs
}

// TODO fix this function to match latest changes
const validateTypeAliasChildren = (type: TypeAliasDeclaration): Error[] => {
  const typeNode = type.getTypeNode()
  const children = typeNode?.forEachChildAsArray()
  const errs: Error[] = []
  if (typeof typeNode !== 'undefined') {
    if (typeNode.getFirstChild()?.getText().trim() !== '{') {
      return [singleValidationErr(type,
        `All typerpc type aliases must be Object aliases, E.G.
      type  Mytype = {
      (properties with valid type rpc data types or other type aliases)
      },
      Simple types (number, string[]), intersections, and unions are not supported at this time.`)]
    }
  }
  if (typeof children === 'undefined') {
    return [singleValidationErr(type, 'Empty type aliases are not supported')]
  }
  for (const child of children) {
    // get the properties type
    const propType = getTypeNode(child)
    if (!isValidDataType(propType.getText().trim()) && !isValidTypeAlias(propType)) {
      errs.push(singleValidationErr(child, 'Invalid property type, Only types imported from @typerpc/types and other type aliases declared in the same file may be used as property types'))
    }
  }

  return errs
}

const genericsErrMsg = (type: TypeAliasDeclaration| MethodSignature) => `${type.getName().trim()} defines a generic type . typerpc types and methods cannot be generic`

const validateTypeAlias = (type: TypeAliasDeclaration): Error[] => {
  return type.getTypeParameters().length > 0 ? [singleValidationErr(type, genericsErrMsg(type))] : []
}

// Ensures no type aliases are generic and all properties are proper types.
const validateTypeAliases = (sourceFile: SourceFile): Error[] => {
  const aliases = sourceFile.getTypeAliases()
  if (aliases.length === 0) {
    return []
  }
  return aliases.flatMap(alias => [...validateTypeAlias(alias), ...validateTypeAliasChildren(alias)])
}

// Ensure type of method params is either a typerpc type or a type
// declared in the same source file.
const validateParams = (method: MethodSignature): Error[] => {
  if (!method.getParameters()) {
    return []
  }
  const paramTypes = method.getParameters().map(param => param.getTypeNode())
  const errs: Error[] = []
  for (const type of paramTypes) {
    if (typeof type === 'undefined') {
      errs.push(singleValidationErr(type, `${method.getName()} method contains one or more parameters that do not specify a valid type. All method parameter must have a valid type`))
    } else if (!isValidDataType(type.getText()) && !isValidTypeAlias(type)) {
      errs.push(singleValidationErr(type, `method parameter type '${type.getText().trim()}', is either not a valid typerpc type or a type alias that is not defined in this file`))
    }
  }
  return errs
}

// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same file.
const validateReturnType = (method: MethodSignature): Error[] => {
  const returnType = method.getReturnTypeNode()
  const returnTypeErr = (typeName: string) => singleValidationErr(method,
    `Invalid return type: '${typeName}'. All typerpc interface methods must return a valid typerpc type or a type alias defined in the same file as the method. To return nothing, use 't.unit'`)
  return typeof returnType === 'undefined' ? [returnTypeErr('undefined')] :
    !isValidDataType(returnType.getText()) && !isValidTypeAlias(returnType) ? [returnTypeErr(returnType.getText().trim())] : []
}

const validateMethodNotGeneric = (method: MethodSignature): Error[] => method.getTypeParameters().length > 0 ? [singleValidationErr(method, genericsErrMsg(method))] : []

// TODO test this function
const validateMethodJsDoc = (method: MethodSignature): Error[] => {
  const tags = method.getJsDocs()[0]?.getTags()
  if (typeof tags === 'undefined' || tags.length === 0) {
    return []
  }
  const validTags = ['throws', 'access', 'returns']
  const errs: Error[] = []
  for (const tag of tags) {
    const tagName = tag.getTagName()
    const comment = tag?.getComment()?.trim() ?? ''
    if (!validTags.includes(tag.getTagName())) {
      errs.push(singleValidationErr(tag, `${tag.getTagName()} is not a valid typerpc JsDoc tag. Valid tags are :${validTags}`))
    }
    if (tagName === 'access' && !isHttpVerb(comment)) {
      errs.push(singleValidationErr(tag, `${tag.getComment()} HTTP method is not supported by typerpc. Valids methods are 'POST' | 'GET'`))
    }
    if (tagName === 'throws') {
      const err = singleValidationErr(tag, `${comment} is not a valid HTTP error response code. Valid error response codes are : ${errCodes}`)
      try {
        if (!isErrCode(parseInt((comment)))) {
          errs.push(err)
        }
      } catch (error) {
        errs.push(err)
      }
    }
    if (tagName === 'returns') {
      const err = singleValidationErr(tag, `${tag.getComment()} is not a valid HTTP success response code. Valid success response codes are : ${responseCodes}`)
      try {
        if (!isResponseCode(parseInt(comment))) {
          errs.push(err)
        }
      } catch (error) {
        errs.push(err)
      }
    }
  }
  return errs
}

// TODO add a validation to check for any|unknown|never|{}

const validateGetMethodParam = (param: ParameterDeclaration): Error[] => {
  return !isQueryParamableString(param.getTypeNode()!.getText().trim()) ?
    [singleValidationErr(param, `${param.getName()} has an invalid type. Methods annotated with @access GET are only allowed to use the following types for parameters: primitive types => ${queryParamablePrims} | container types => ${queryParamableContainers}. Also note, that container types can only use one of the mentioned primitive types as type parameters`)] : []
}

// TODO test this function
const validateGetRequestMethodParams = (method: MethodSignature): Error[] => {
  const params = method.getParameters()
  if (getJsDocComment(method, 'access')?.toUpperCase() !== 'GET' || params.length === 0) {
    return []
  }
  return params.flatMap(param => validateGetMethodParam(param))
}

const getMethodsForFile = (file: SourceFile): MethodSignature[] => file.getInterfaces().flatMap(interfc => interfc.getMethods())

// Validates method params and return types.
const validateMethods = (sourceFile: SourceFile): Error[] => getMethodsForFile(sourceFile).flatMap(method => [...validateParams(method), ...validateReturnType(method), ...validateMethodNotGeneric(method), ...validateMethodJsDoc(method), ...validateGetRequestMethodParams(method)])

const validateSchema = (sourceFile: SourceFile): Error[] => {
  return [
    ...validateFunctions(sourceFile),
    ...validateVariables(sourceFile),
    ...validateImports(sourceFile),
    ...validateClasses(sourceFile),
    ...validateExports(sourceFile),
    ...validateNameSpaces(sourceFile),
    ...validateStatements(sourceFile),
    ...validateRefs(sourceFile),
    ...validateEnums(sourceFile),
    ...validateTypeAliases(sourceFile),
    ...validateInterfaces(sourceFile),
    ...validateMethods(sourceFile),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] =>
  schemas.flatMap(schema => [...validateSchema(schema)])

