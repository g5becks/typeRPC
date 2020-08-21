// file deepcode ignore semicolon: conflicts with eslint settings
// file deepcode ignore interface-over-type-literal: improper
import {
  InterfaceDeclaration,
  MethodSignature,
  Node,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  TypeNode,
} from 'ts-morph'
import {containersList, primitivesMap} from './types'
import {getTypeNode} from './builder'
import {HttpErrCode, HttpResponseCode, HTTPVerb} from './schema'

export const isHttpVerb = (method: string | undefined): method is HTTPVerb =>
  ['POST', 'GET'].includes(method ?? '')

const responseCodes = [200, 201, 202, 203, 204, 205, 206, 300, 301, 302, 303, 304, 305, 306, 307, 308]

export const isResponseCode = (code: number| undefined): code is HttpResponseCode => responseCodes.includes(code ?? 0)

const errCodes = [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 422, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]

export const isErrCode = (code: number | undefined): code is HttpErrCode => errCodes.includes(code ?? 0)

type Violator = {
  name?: string;
  lineNumber?: number;
}
const multiSchemaErr = (numInvalids: number, type: string, violators: Violator[], sourceFile: SourceFile): Error =>
  new Error(`${sourceFile.getFilePath()?.toString()} contains ${numInvalids} ${type} declarations
   errors: ${violators.map(vio => String(vio?.name) + ', at line number: ' + String(vio?.lineNumber) + '\n')}
   message: typerpc schemas can only contain a single import statement (import {t} from '@typerpc/types'), typeAlias (message), and interface (service) declarations.`)

const singleErr = (node: Node | undefined, msg: string): Error => {
  return new Error(
    `error in file: ${node?.getSourceFile()?.getFilePath()}
     at line number: ${node?.getStartLineNumber()}
     message: ${msg}`)
}

// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => {
  const functions = sourceFile.getFunctions()
  return functions.length > 0 ? [multiSchemaErr(functions.length, 'function', functions.map(func => {
    return {name: func.getName(), lineNumber: func.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => {
  const variables = sourceFile.getVariableDeclarations()
  return variables.length > 0 ? [multiSchemaErr(variables.length, 'variable', variables.map(vari => {
    return {name: vari.getName(), lineNumber: vari.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => {
  const classes = sourceFile.getClasses()
  return classes.length > 0 ? [multiSchemaErr(classes.length, 'class', classes.map(cls => {
    return {name: cls.getName(), lineNumber: cls.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure only one valid import without aliasing the namespace
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0]?.getImportClause()?.getNamedImports()[0].getText().trim()
  const errs: Error[] = []
  if (imports.length !== 1) {
    errs.push(singleErr(sourceFile, "typerpc schema files must contain only one import declaration => import {t} from '@typerpc/types"))
  } else if (imports[0].getImportClause()?.getNamedImports()[0].getText().trim() !== 't') {
    errs.push(singleErr(sourceFile, `Invalid import statement => ${imp}, @typerpc/types namespace can only be imported as {t}`))
  }
  return errs
}

// Ensure zero exports
const validateExports = (sourceFile: SourceFile): Error[] => {
  const allExports = sourceFile.getExportAssignments()
  const exportDecs = sourceFile.getExportDeclarations()
  const exportSym = sourceFile.getExportSymbols()
  const errs = allExports.length > 0 ? [multiSchemaErr(allExports.length, 'export', allExports.map(exp => {
    return {name: exp.getText().trim()}
  }), sourceFile)] : []
  if (exportDecs.length > 0) {
    errs.push(multiSchemaErr(exportDecs.length, 'export', exportDecs.map(exp => {
      return {name: exp.getText().trim(), lineNumber: exp.getStartLineNumber()}
    }), sourceFile))
  }
  if (exportSym.length > 0) {
    errs.push(multiSchemaErr(exportSym.length, 'export', exportSym.map(exp => {
      return {name: exp.getName()}
    }), sourceFile))
  }
  return errs
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => {
  const spaces = sourceFile.getNamespaces()
  return spaces.length > 0 ? [multiSchemaErr(spaces.length, 'namespace', spaces.map(space => {
    return {name: space.getName(), lineNumber: space.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  const invalidKinds = [SyntaxKind.AbstractKeyword, SyntaxKind.AwaitExpression, SyntaxKind.ArrayType, SyntaxKind.ArrowFunction,  SyntaxKind.TaggedTemplateExpression, SyntaxKind.SpreadAssignment, SyntaxKind.JsxExpression, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.SwitchStatement]
  const invalids = stmnts.filter(stmnt => invalidKinds.includes(stmnt.getKind()))
  return invalids.length > 0 ? [multiSchemaErr(stmnts.length, 'top level statement', invalids.map(stmnt => {
    return {name: stmnt.getText().trim(), lineNumber: stmnt.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure no enums
const validateEnums = (sourceFile: SourceFile): Error[] => {
  const enums = sourceFile.getEnums()
  return enums.length > 0 ? [multiSchemaErr(enums.length, 'enum', enums.map(enu => {
    return {name: enu.getName(), lineNumber: enu.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero references to other files
const validateRefs = (sourceFile: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = sourceFile.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(multiSchemaErr(nodeSourceRefs.length - 1, 'source reference', nodeSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => {
      return {name: ref.getText().trim(), lineNumber: ref.getStartLineNumber()}
    }), sourceFile))
  }
  // should be 1
  const literalSourceRefs = sourceFile.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(multiSchemaErr(literalSourceRefs.length - 1, 'literal source reference', literalSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => {
      return {name: ref.getText().trim(), lineNumber: ref.getStartLineNumber()}
    }), sourceFile))
  }
  // should be 1
  const sourceRefs = sourceFile.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(multiSchemaErr(sourceRefs.length - 1, 'source reference', sourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => {
      return {name: ref.getText().trim(), lineNumber: ref.getStartLineNumber()}
    }), sourceFile))
  }
  // should be 0
  const libraryRefs = sourceFile.getLibReferenceDirectives()
  if (libraryRefs.length > 0) {
    errs.push(multiSchemaErr(libraryRefs.length, 'library reference', libraryRefs.map(ref => {
      return {name: ref.getText().trim()}
    }), sourceFile))
  }
  // should be 0
  const pathRefs = sourceFile.getPathReferenceDirectives()
  if (pathRefs.length > 0) {
    errs.push(multiSchemaErr(pathRefs.length, 'path reference', pathRefs.map(ref => {
      return {name: ref.getText().trim()}
    }), sourceFile))
  }
  // should be 0
  const typeDirRefs = sourceFile.getTypeReferenceDirectives()
  if (typeDirRefs.length > 0) {
    errs.push(multiSchemaErr(typeDirRefs.length, 'type reference directive', typeDirRefs.map(ref => {
      return {name: ref.getText().trim()}
    }), sourceFile))
  }
  return errs
}

export const isPrimitive = (typeText: string): boolean => primitivesMap.has(typeText.trim())

export const isContainer = (typeText: string): boolean => containersList.some(container => typeText.trim().startsWith(container))

const isValidDataType = (typeText: string): boolean => isPrimitive(typeText) || isContainer(typeText)

const isValidTypeAlias = (type: TypeNode | Node): boolean => type.getSourceFile().getTypeAliases().map(alias => alias.getNameNode().getText().trim()).includes(type.getText().trim())

const validateTypeAliasChildren = (type: TypeAliasDeclaration): Error[] => {
  const typeNode = type.getTypeNode()
  const children = typeNode?.forEachChildAsArray()
  const errs: Error[] = []
  if (typeof typeNode !== 'undefined') {
    if (typeNode.getFirstChild()?.getText().trim() !== '{') {
      return [singleErr(type,
        `All typerpc type aliases must be Object aliases, E.G.
      type  Mytype = {
      (properties with valid type rpc data types or other type aliases)
      },
      Simple types (number, string[]), intersections, and unions are not supported at this time.`)]
    }
  }
  if (typeof children === 'undefined') {
    return [singleErr(type, 'Empty type aliases are not supported')]
  }
  for (const child of children) {
    // get the properties type
    const propType = getTypeNode(child)
    if (!isValidDataType(propType.getText().trim()) && !isValidTypeAlias(propType)) {
      errs.push(singleErr(child, 'Invalid property type, Only types imported from @typerpc/types and other type aliases declared in the same file may be used as property types'))
    }
  }

  return errs
}

const genericsErrMsg = (type: TypeAliasDeclaration| InterfaceDeclaration| MethodSignature) => `${type.getName().trim()} defines a generic type . typerpc types and methods cannot be generic`

const validateTypeAlias = (type: TypeAliasDeclaration): Error[] => {
  return type.getTypeParameters().length > 0 ? [singleErr(type, genericsErrMsg(type))] : []
}

// Ensures no type aliases are generic and all properties are proper types.
const validateTypeAliases = (sourceFile: SourceFile): Error[] => {
  const aliases = sourceFile.getTypeAliases()
  if (aliases.length === 0) {
    return []
  }
  return aliases.flatMap(alias => [...validateTypeAlias(alias), ...validateTypeAliasChildren(alias)])
}

const validateInterface = (interfc: InterfaceDeclaration): Error[] => {
  let errs: Error[] = []
  if (interfc.getMethods().length === 0) {
    errs = errs.concat(singleErr(interfc, 'all typerpc interfaces must declare at least one method'))
  }
  if (interfc.getTypeParameters().length > 0) {
    errs = errs.concat(singleErr(interfc, genericsErrMsg(interfc)))
  }
  if (interfc.getExtends().length > 0) {
    errs = errs.concat(singleErr(interfc, 'typerpc interfaces are not allowed to contain extends clauses'))
  }
  return errs
}

// Ensure at least one interface and no interfaces are generic
const validateInterfaces = (sourceFile: SourceFile): Error[] => {
  const interfaces = sourceFile.getInterfaces()
  if (interfaces.length === 0) {
    return [new  Error(`error in file ${sourceFile.getFilePath().toString()}
    message: All typerpc schema files must contain at least one interface (service) definition`)]
  }

  return interfaces.flatMap(interfc => validateInterface(interfc))
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
      errs.push(singleErr(type, `${method.getName()} method contains one or more parameters that do not specify a valid type. All method parameter must have a valid type`))
    } else if (!isValidDataType(type.getText()) && !isValidTypeAlias(type)) {
      errs.push(singleErr(type, `method parameter type '${type.getText().trim()}', is either not a valid typerpc type or a type alias that is not defined in this file`))
    }
  }
  return errs
}

// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same file.
const validateReturnType = (method: MethodSignature): Error[] => {
  const returnType = method.getReturnTypeNode()
  const returnTypeErr = (typeName: string) => singleErr(method,
    `Invalid return type: '${typeName}'. All typerpc interface methods must return a valid typerpc type or a type alias defined in the same file as the method. To return nothing, use 't.unit'`)
  return typeof returnType === 'undefined' ? [returnTypeErr('undefined')] :
    !isValidDataType(returnType.getText()) && !isValidTypeAlias(returnType) ? [returnTypeErr(returnType.getText().trim())] : []
}

const validateMethodNotGeneric = (method: MethodSignature): Error[] => method.getTypeParameters().length > 0 ? [singleErr(method, genericsErrMsg(method))] : []

const validateMethodJsDoc = (method: MethodSignature): Error[] => {
  const tags = method.getJsDocs()[0]?.getTags()
  const validTags = ['throws', 'access', 'returns']
  const errs: Error[] = []
  for (const tag of tags) {
    const tagName = tag.getTagName()
    const comment = tag?.getComment()?.trim() ?? ''
    if (!validTags.includes(tag.getTagName())) {
      errs.push(singleErr(tag, `${tag.getTagName()} is not a valid typerpc JsDoc tag. Valid tags are :${validTags}`))
    }
    if (tagName === 'access' && !isHttpVerb(comment)) {
      errs.push(singleErr(tag, `${tag.getComment()} HTTP method is not supported by typerpc. Valids methods are 'POST' | 'GET'`))
    }
    if (tagName === 'throws') {
      const err = singleErr(tag, `${comment} is not a valid HTTP error response code. Valid error response codes are : ${errCodes}`)
      try {
        if (!isErrCode(parseInt((comment)))) {
          errs.push(err)
        }
      } catch (error) {
        errs.push(err)
      }
    }
    if (tagName === 'returns') {
      const err = singleErr(tag, `${tag.getComment()} is not a valid HTTP success response code. Valid success response codes are : ${responseCodes}`)
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

const getMethodsForFile = (file: SourceFile): MethodSignature[] => file.getInterfaces().flatMap(interfc => interfc.getMethods())

// Validates method params and return types.
const validateMethods = (sourceFile: SourceFile): Error[] => getMethodsForFile(sourceFile).flatMap(method => [...validateParams(method), ...validateReturnType(method), ...validateMethodNotGeneric(method), ...validateMethodJsDoc(method)])

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

