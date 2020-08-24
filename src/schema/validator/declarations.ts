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

// TODO fix this function to match new import
// Ensure only one valid import without aliasing namespaces
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0]?.getImportClause()?.getNamedImports()[0].getText().trim()
  const errs: Error[] = []
  if (imports.length !== 1) {
    errs.push(singleValidationErr(sourceFile, 'typerpc schema files must contain only one import declaration => import {t} from \'@typerpc/types'))
  } else if (imports[0].getImportClause()?.getNamedImports()[0].getText().trim() !== 't') {
    errs.push(singleValidationErr(sourceFile, `Invalid import statement => ${imp}, @typerpc/types namespace can only be imported as {t}`))
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
