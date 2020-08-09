import {InterfaceDeclaration, MethodSignature, SourceFile, TypeAliasDeclaration, TypeNode, Node} from 'ts-morph'
import {containersList, primitivesMap} from './types'
import {getMethodsForFile} from '../parser'

const Err = (numInvalids: number, type: string, violators: string[], sourceFile: SourceFile): Error =>
  new Error(`${sourceFile.getBaseName()} contains ${numInvalids} ${type} declarations => ${violators}. typerpc schemas can only contain a single import statement => import {t} from '@typerpc/types', typeAlias => (message), and interface => (service) declarations.`)

// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => {
  const functions = sourceFile.getFunctions()
  return functions.length ? [Err(functions.length, 'function', functions.map(func => func.getName() ?? ''), sourceFile)] : []
}

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => {
  const variables = sourceFile.getVariableDeclarations()
  return variables.length ? [Err(variables.length, 'variable', variables.map(vari => vari.getName() ?? ''), sourceFile)] : []
}

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => {
  const classes = sourceFile.getClasses()
  return classes.length ? [Err(classes.length, 'class', classes.map(cls => cls.getName() ?? ''), sourceFile)] : []
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
  const errs = allExports.length ? [Err(allExports.length, 'export', allExports.map(exp => exp.getText().trim()), sourceFile)] : []
  if (typeof defExp !== 'undefined') {
    errs.push(Err(1, 'default export', [defExp.getName()], sourceFile))
  }
  if (exportDecs.length) {
    errs.push(Err(exportDecs.length, 'export', exportDecs.map(exp => exp.getText()), sourceFile))
  }
  if (exportSym.length) {
    errs.push(Err(exportSym.length, 'export', exportSym.map(exp => exp.getName()), sourceFile))
  }
  return errs
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => {
  const spaces = sourceFile.getNamespaces()
  return spaces.length ? [Err(spaces.length, 'namespace', spaces.map(space => space.getName()), sourceFile)] : []
}

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  return stmnts.length ? [Err(stmnts.length, 'top level statement', stmnts.map(stmnt => stmnt.getText()), sourceFile)] : []
}

// Ensure no enums
const validateEnums = (sourceFile: SourceFile): Error[] => {
  const enums = sourceFile.getEnums()
  return enums.length ? [Err(enums.length, 'enum', enums.map(enu => enu.getName()), sourceFile)] : []
}

// Ensure zero references to other files
const validateRefs = (sourceFile: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = sourceFile.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(Err(nodeSourceRefs.length - 1, 'source reference', nodeSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile))
  }
  // should be 1
  const literalSourceRefs = sourceFile.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(Err(literalSourceRefs.length - 1, 'literal source reference', literalSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile))
  }
  // should be 1
  const sourceRefs = sourceFile.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(Err(sourceRefs.length - 1, 'source reference', sourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile))
  }
  // should be 0
  const libraryRefs = sourceFile.getLibReferenceDirectives()
  if (literalSourceRefs.length) {
    errs.push(Err(libraryRefs.length, 'library reference', libraryRefs.map(ref => ref.getText()), sourceFile))
  }
  // should be 0
  const pathRefs = sourceFile.getPathReferenceDirectives()
  if (pathRefs.length) {
    errs.push(Err(pathRefs.length, 'path reference', pathRefs.map(ref => ref.getText()), sourceFile))
  }
  // should be 0
  const typeDirRefs = sourceFile.getTypeReferenceDirectives()
  if (typeDirRefs.length) {
    errs.push(Err(typeDirRefs.length, 'type reference directive', typeDirRefs.map(ref => ref.getText()), sourceFile))
  }
  return errs
}

const genericErr = (type: TypeAliasDeclaration | InterfaceDeclaration | MethodSignature): Error => new Error(`typeError at: ${type.getStartLineNumber()}. ${type.getName().trim()} defines a generic type constraint. typerpc types cannot be generic`)

const validateTypeAliasChildren = (type: TypeAliasDeclaration): Error[] => {
  // grabs the actual type declaration node e.g. everything after the = sign
  // then returns the children, aka properties.
  const children = type.getTypeNode()?.forEachChildAsArray()
  const errs: Error[] = []
  if (typeof children === 'undefined') {
    errs.push(new Error(`type error in file ${type.getSourceFile().getBaseName()}
    at line number: ${type.getStartLineNumber()}. Empty types not supported`))
  } else {
    for (const child of children) {
      // get the properties type
      const propType = child.getChildAtIndex(2)
      if (!isValidDataType(propType.getText().trim()) && !isValidTypeAlias(propType)) {
        errs.push(new Error(`type error in file: ${child.getSourceFile()} at line number ${child.getStartLineNumber()}. Invalid property type. Only types imported from @typerpc/types and other type aliases declared in the same file may be used as property types`))
      }
    }
  }
  return errs
}
// Ensures no type aliases are generic
const validateTypeAliases = (sourceFile: SourceFile): Error[] => {
  const aliases = sourceFile.getTypeAliases()
  if (!aliases.length) {
    return []
  }
  const errs: Error[] = []
  for (const alias of aliases) {
    if (alias.getTypeParameters.length) {
      errs.push(genericErr(alias))
    }
    errs.push(...validateTypeAliasChildren(alias))
  }
  return errs
}

// Ensure at least one interface and no interfaces are generic
const validateInterfaces = (sourceFile: SourceFile): Error[] => {
  const interfaces = sourceFile.getInterfaces()
  if (!interfaces.length) {
    return [new  Error(`error in file => ${sourceFile.getBaseName()}. All typerpc schema files must contain at least one interface (service) definition`)]
  }
  const errs: Error[] = []
  for (const intrfc of interfaces) {
    if (intrfc.getTypeParameters().length) {
      errs.push(genericErr(intrfc))
    }
  }
  return errs
}

export const isPrimitive = (typeText: string): boolean => primitivesMap.has(typeText.trim())

export const isContainer = (typeText: string): boolean => containersList.some(container => typeText.trim().startsWith(container))

const isValidDataType = (typeText: string): boolean => isPrimitive(typeText) || isContainer(typeText)

const isValidTypeAlias = (type: TypeNode | Node): boolean => type.getSourceFile().getTypeAliases().map(alias => alias.getNameNode().getText().trim()).includes(type.getText().trim())

// Ensure type of method params is either a typerpc type or a type
// declared in the same source file.
const validateParams = (method: MethodSignature): Error[] => {
  if (!method.getParameters()) {
    return []
  }
  const paramErr = (type: TypeNode, msg: string) => new Error(`error in file: ${type.getSourceFile().getBaseName()} at: ${type.getStartLineNumber()}. ${msg}`)
  const paramTypes = method.getParameters().map(param => param.getTypeNode())
  const errs: Error[] = []
  for (const type of paramTypes) {
    if (typeof type !== 'undefined') {
      if (!isValidDataType(type.getText()) && !isValidTypeAlias(type)) {
        errs.push(paramErr(type, `typeError: ${type} is either not a valid typerpc type or is not defined in this file`))
      } else {
        errs.push(paramErr(type, 'param has not type. All params must have a valid type'))
      }
    }
  }
  return errs
}

// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same file.
const validateReturnType = (method: MethodSignature): Error[] => {
  const returnType = method.getReturnTypeNode()
  const returnTypeErr = (typeName: string) => new Error(`typerc error in file: ${method.getSourceFile().getBaseName()} at: ${method.getStartLineNumber()}. All typerpc interface methods must contain a valid return type. Invalid return type: ${typeName}`)
  return typeof returnType === 'undefined' ? [returnTypeErr('undefined')] :
    !isValidDataType(returnType.getText()) && !isValidTypeAlias(returnType) ? [returnTypeErr(returnType.getText().trim())] : []
}

const validateMethodNotGeneric = (method: MethodSignature): Error[] => method.getTypeParameters().length ? [genericErr(method)] : []

// Validates method params and return types.
const validateMethods = (sourceFile: SourceFile): Error[] => {
  const methods = getMethodsForFile(sourceFile)
  const errs: Error[] = []
  for (const method of methods) {
    errs.push(...validateParams(method),
      ...validateReturnType(method),
      ...validateMethodNotGeneric(method)
    )
  }
  return errs
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
    ...validateEnums(sourceFile),
    ...validateTypeAliases(sourceFile),
    ...validateInterfaces(sourceFile),
    ...validateMethods(sourceFile),
  ]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] => {
  const errs: Error[] = []
  for (const schema of schemas) {
    errs.push(...validateSchema(schema))
  }
  return errs
}
