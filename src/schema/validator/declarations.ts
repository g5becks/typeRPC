import {SourceFile, SyntaxKind, TypeAliasDeclaration} from 'ts-morph'
import {isMsg, isService, multiValidationErr, singleValidationErr, validateNotGeneric, Violator} from './utils'

const validate = (declarations: Violator[]): Error[] => declarations.length > 0 ? [multiValidationErr(declarations)] : []
// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => validate(sourceFile.getFunctions())

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => validate(sourceFile.getVariableDeclarations())

// Ensure Zero Interfaces
const validateInterfaces = (sourceFile: SourceFile): Error[] => validate(sourceFile.getInterfaces())

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => validate(sourceFile.getClasses())

// Ensure only one valid import without aliasing namespaces
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  if (typeof imports[0].getImportClause() === 'undefined') {
    return [singleValidationErr(sourceFile, `no import statement found. Please add import {rpc, t} from '@typerpc/types to ${sourceFile.getFilePath().toString()}'`)]
  }
  const importNames = imports[0].getImportClause()?.getNamedImports().map(imp => imp.getName())
  let errs: Error[] = []
  if (imports.length !== 1) {
    errs = errs.concat(singleValidationErr(sourceFile, 'typerpc schema files must contain only one import declaration, import {rpc, t} from \'@typerpc/types\''))
  } else if (importNames?.length !== 2 && importNames![0] !== 'rpc' && importNames![1] !== 't') {
    errs.push(singleValidationErr(sourceFile, `Invalid import statement => ${importNames}, @typerpc/types  can only be imported as import {rpc, t} from '@typerpc/types', aliasing is not allowed`))
  }
  return errs
}

// Ensure zero exports
const validateExports = (sourceFile: SourceFile): Error[] => {
  return [...validate(sourceFile.getExportAssignments()), ...validate(sourceFile.getExportDeclarations())]
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => validate(sourceFile.getNamespaces())

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  const invalidKinds = [SyntaxKind.AbstractKeyword, SyntaxKind.AwaitExpression, SyntaxKind.ArrayType, SyntaxKind.ArrowFunction, SyntaxKind.TaggedTemplateExpression, SyntaxKind.SpreadAssignment, SyntaxKind.JsxExpression, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.SwitchStatement, SyntaxKind.LessThanLessThanEqualsToken]
  const invalids = stmnts.filter(stmnt => invalidKinds.includes(stmnt.getKind()))
  return invalids.length > 0 ? [multiValidationErr(invalids)] : []
}
// Ensure zero enums
const validateEnums = (sourceFile: SourceFile): Error[] => validate(sourceFile.getEnums())

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

const validateJsDoc = (type: TypeAliasDeclaration): Error[] => {
  if (type.getJsDocs().length === 0) {
    return []
  }
  const tags = type.getJsDocs()[0].getTags().filter(tag => tag.getTagName() === 'kind')
  if (tags.length > 0 && tags.length !== 1) {
    return [singleValidationErr(tags[0], 'A message or service can only have a single @kind tag')]
  }
  return tags[0].getComment() !== 'cbor' ? [singleValidationErr(tags[0], `there is only one valid comment for the @kind tag (cbor), found ${tags[0].getComment()}`)] : []
}

// Runs a pre-validation step on all type aliases found in a schema file
// to ensure they are eligible to move forward into the next validation stage.
// This check ensures the type is either an rpc.Service or rpc.Msg,
// that the type has a typeNode, that the typeNode is a TypeLiteral
// and that the type is not generic
const preValidateType = (type: TypeAliasDeclaration): Error[] => {
  let errs: Error[] = []
  if (typeof type.getTypeNode() === 'undefined') {
    return [singleValidationErr(type, `${type.getName()} has no type node`)]
  }
  if (type.getTypeNode()!.getChildrenOfKind(SyntaxKind.TypeLiteral).length !== 1) {
    return [singleValidationErr(type,
      `All typerpc messages and services must be Type Literals, E.G.
      type  Mytype = {
      (properties with valid type rpc data types or other rpc.Msg types)
      },
      Typescript types (number, string[]), intersections, and unions are not supported.`)]
  }
  if (!isMsg(type) || isService(type)) {
    errs = errs.concat(singleValidationErr(type, `typerpc schema files cannot contain type
	  aliases that are not either rpc.Msg, or rpc.Service definitions.`))
  }

  errs = [...errs, ...validateNotGeneric(type), ...(validateJsDoc(type))]

  return errs
}

const validateTypes = (sourceFile: SourceFile): Error[] =>
  sourceFile.getTypeAliases().flatMap(alias => preValidateType(alias))

export const validateDeclarations = (file: SourceFile): Error[] => {
  return [...validateFunctions(file),
    ...validateVariables(file),
    ...validateInterfaces(file),
    ...validateClasses(file),
    ...validateImports(file),
    ...validateExports(file),
    ...validateNameSpaces(file),
    ...validateStatements(file),
    ...validateEnums(file),
    ...validateRefs(file),
    ...validateTypes(file)]
}
