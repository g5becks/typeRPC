import {MethodSignature, Node, SourceFile, TypeNode} from 'ts-morph'
import {containersList, primitivesMap} from './types'
import {getMethodsForFile} from '../parser'

const errMsg = (numInvalids: number, type: string, violators: string[], sourceFile: SourceFile) =>
  `${sourceFile.getBaseName()} contains ${numInvalids} ${type} declarations => ${violators}. typerpc schemas can only contain a single import statement => import {t} from '@typerpc/types',  enum => (message),  typeAlias => (message), and interface => (service) declarations.`

// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => {
  const functions = sourceFile.getFunctions()
  return functions.length ? [new Error(errMsg(functions.length, 'function', functions.map(func => func.getName() ?? ''), sourceFile))] : []
}

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => {
  const variables = sourceFile.getVariableDeclarations()
  return variables.length ? [new Error(errMsg(variables.length, 'variable', variables.map(vari => vari.getName() ?? ''), sourceFile))] : []
}

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => {
  const classes = sourceFile.getClasses()
  return classes.length ? [new Error(errMsg(classes.length, 'class', classes.map(cls => cls.getName() ?? ''), sourceFile))] : []
}

// Ensure only one valid import without aliasing the namespace
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0].getImportClause()?.getNamedImports()[0].getText().trim()
  const errs: Error[] = []
  if (imports.length !== 1) {
    errs.push(
      new Error(`error in file ${sourceFile.getBaseName()}. typerpc schema files must contain only one import declaration => import {t} from '@typerpc/types'`)
    )
  } else if (imports[0].getImportClause()?.getNamedImports()[0].getText().trim() !== 't') {
    errs.push(new Error(`error in file ${sourceFile.getBaseName()}. Invalid import statement => ${imp}, types namespace can only be imported as {t}`))
  }
  return errs
}

// Ensure zero exports
const validateExports = (sourceFile: SourceFile): Error[] => {
  const allExports = sourceFile.getExportAssignments()
  const defExp = sourceFile.getDefaultExportSymbol()
  const exportDecs = sourceFile.getExportDeclarations()
  const exportSym = sourceFile.getExportSymbols()
  const errs = allExports.length ? [new Error(errMsg(allExports.length, 'export', allExports.map(exp => exp.getText().trim()), sourceFile))] : []
  if (typeof defExp !== 'undefined') {
    errs.push(new Error(errMsg(1, 'default export', [defExp.getName()], sourceFile)))
  }
  if (exportDecs.length) {
    errs.push(new Error(errMsg(exportDecs.length, 'export', exportDecs.map(exp => exp.getText()), sourceFile)))
  }
  if (exportSym.length) {
    errs.push(new Error(errMsg(exportSym.length, 'export', exportSym.map(exp => exp.getName()), sourceFile)))
  }
  return errs
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => {
  const spaces = sourceFile.getNamespaces()
  return spaces.length ? [new Error(errMsg(spaces.length, 'namespace', spaces.map(space => space.getName()), sourceFile))] : []
}

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  return stmnts.length ? [new Error(errMsg(stmnts.length, 'top level statement', stmnts.map(stmnt => stmnt.getText()), sourceFile))] : []
}

// Ensure zero references to other files
const validateRefs = (sourceFile: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = sourceFile.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(new Error(errMsg(nodeSourceRefs.length - 1, 'source reference', nodeSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile)))
  }
  // should be 1
  const literalSourceRefs = sourceFile.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(new Error(errMsg(literalSourceRefs.length - 1, 'literal source reference', literalSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile)))
  }
  // should be 1
  const sourceRefs = sourceFile.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(new Error(errMsg(sourceRefs.length - 1, 'source reference', sourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile)))
  }
  // should be 0
  const libraryRefs = sourceFile.getLibReferenceDirectives()
  if (literalSourceRefs.length) {
    errs.push(new Error(errMsg(libraryRefs.length, 'library reference', libraryRefs.map(ref => ref.getText()), sourceFile)))
  }
  // should be 0
  const pathRefs = sourceFile.getPathReferenceDirectives()
  if (pathRefs.length) {
    errs.push(new Error(errMsg(pathRefs.length, 'path reference', pathRefs.map(ref => ref.getText()), sourceFile)))
  }
  // should be 0
  const typeDirRefs = sourceFile.getTypeReferenceDirectives()
  if (typeDirRefs.length) {
    errs.push(new Error(errMsg(typeDirRefs.length, 'type reference directive', typeDirRefs.map(ref => ref.getText()), sourceFile)))
  }
  return errs
}

export const isPrimitive = (type: TypeNode | Node): boolean => primitivesMap.has(type.getText().trim())

export const isContainer = (type: TypeNode | Node): boolean => containersList.some(container => type.getText().trim().startsWith(container))

const isValidDataType = (type: TypeNode | Node): boolean => isPrimitive(type) || isContainer(type)

const isValidTypeAlias = (type: TypeNode | Node, sourceFile: SourceFile): boolean => {
  const aliases = sourceFile.getTypeAliases().map(alias => alias.getNameNode().getText().trim())
  return aliases.includes(type.getText().trim())
}

// Ensure type of method params is either a typerpc type or a type
// declared in the same source file.
const validateParams = (method: MethodSignature, sourceFile: SourceFile): Error[] => {
  if (!method.getParameters()) {
    return []
  }
  const paramErr = (type: TypeNode, msg: string) => `error in file: ${type.getSourceFile().getBaseName()} at: ${type.getEndLineNumber()}. ${msg}`
  const paramTypes = method.getParameters().map(param => param.getTypeNode())
  const errs: Error[] = []
  for (const type of paramTypes) {
    if (typeof type !== 'undefined') {
      if (!isValidDataType(type) || !isValidTypeAlias(type, sourceFile)) {
        errs.push(new Error(paramErr(type, `typeError: ${type} is either not a valid typerpc type or is not defined in this file`)))
      } else {
        errs.push(new Error(paramErr(type, 'all params must have a valid type')))
      }
    }
  }
  return errs
}

const validateMethods = (sourceFile: SourceFile): Error[] => {
  const methods = getMethodsForFile(sourceFile)
  const types = sourceFile.getTypeAliases().map(alias => alias.getName().trim())
}

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
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] => {
  const errs: Error[] = []
  for (const schema of schemas) {
    errs.push(...validateSchema(schema))
  }
  return errs
}
