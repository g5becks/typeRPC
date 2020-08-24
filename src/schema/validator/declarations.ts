import {SourceFile, SyntaxKind} from 'ts-morph'
import {multiValidationErr, singleValidationErr, Violator} from './utils'

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
    ...validateRefs(file)]
}
