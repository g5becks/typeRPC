// file deepcode ignore semicolon: conflicts with eslint settings
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

const err = (numInvalids: number, type: string, violators: string[], sourceFile: SourceFile): Error =>
  new Error(`${sourceFile.getBaseName()} contains ${numInvalids} ${type} declarations => ${violators} .
  typerpc schemas can only contain a single import statement => import {t} from '@typerpc/types', typeAlias => (message), and interface => (service) declarations.`)

// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => {
  const functions = sourceFile.getFunctions()
  return functions.length > 0 ? [err(functions.length, 'function', functions.map(func => func.getName() ?? ''), sourceFile)] : []
}

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => {
  const variables = sourceFile.getVariableDeclarations()
  return variables.length > 0 ? [err(variables.length, 'variable', variables.map(vari => vari.getName() ?? ''), sourceFile)] : []
}

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => {
  const classes = sourceFile.getClasses()
  return classes.length > 0 ? [err(classes.length, 'class', classes.map(cls => cls.getName() ?? ''), sourceFile)] : []
}

// Ensure only one valid import without aliasing the namespace
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0]?.getImportClause()?.getNamedImports()[0].getText().trim()
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
  const errs = allExports.length > 0 ? [err(allExports.length, 'export', allExports.map(exp => exp.getText().trim()), sourceFile)] : []
  if (typeof defExp !== 'undefined') {
    errs.push(err(1, 'default export', [defExp.getName()], sourceFile))
  }
  if (exportDecs.length > 0) {
    errs.push(err(exportDecs.length, 'export', exportDecs.map(exp => exp.getText()), sourceFile))
  }
  if (exportSym.length > 0) {
    errs.push(err(exportSym.length, 'export', exportSym.map(exp => exp.getName()), sourceFile))
  }
  return errs
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => {
  const spaces = sourceFile.getNamespaces()
  return spaces.length > 0 ? [err(spaces.length, 'namespace', spaces.map(space => space.getName()), sourceFile)] : []
}

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  const invalidKinds = [SyntaxKind.AbstractKeyword, SyntaxKind.AwaitExpression, SyntaxKind.ArrayType, SyntaxKind.ArrowFunction, SyntaxKind.VariableStatement, SyntaxKind.TaggedTemplateExpression, SyntaxKind.SpreadAssignment, SyntaxKind.JsxExpression, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.SwitchStatement]
  const invalids = stmnts.filter(stmnt => invalidKinds.includes(stmnt.getKind()))
  return invalids.length > 0 ? [err(stmnts.length, 'top level statement', stmnts.map(stmnt => `${stmnt.getText()} at line number: ${stmnt.getStartLineNumber()}`), sourceFile)] : []
}

// Ensure no enums
const validateEnums = (sourceFile: SourceFile): Error[] => {
  const enums = sourceFile.getEnums()
  return enums.length > 0 ? [err(enums.length, 'enum', enums.map(enu => enu.getName()), sourceFile)] : []
}

// Ensure zero references to other files
const validateRefs = (sourceFile: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = sourceFile.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(err(nodeSourceRefs.length - 1, 'source reference', nodeSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile))
  }
  // should be 1
  const literalSourceRefs = sourceFile.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(err(literalSourceRefs.length - 1, 'literal source reference', literalSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile))
  }
  // should be 1
  const sourceRefs = sourceFile.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(err(sourceRefs.length - 1, 'source reference', sourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => ref.getText()), sourceFile))
  }
  // should be 0
  const libraryRefs = sourceFile.getLibReferenceDirectives()
  if (libraryRefs.length > 0) {
    errs.push(err(libraryRefs.length, 'library reference', libraryRefs.map(ref => ref.getText()), sourceFile))
  }
  // should be 0
  const pathRefs = sourceFile.getPathReferenceDirectives()
  if (pathRefs.length > 0) {
    errs.push(err(pathRefs.length, 'path reference', pathRefs.map(ref => ref.getText()), sourceFile))
  }
  // should be 0
  const typeDirRefs = sourceFile.getTypeReferenceDirectives()
  if (typeDirRefs.length > 0) {
    errs.push(err(typeDirRefs.length, 'type reference directive', typeDirRefs.map(ref => ref.getText()), sourceFile))
  }
  return errs
}

const genericErr = (type: TypeAliasDeclaration | InterfaceDeclaration | MethodSignature): Error => new Error(`typeError at: ${type.getStartLineNumber()}. ${type.getName().trim()} defines a generic type constraint. typerpc types cannot be generic`)

export const isPrimitive = (typeText: string): boolean => primitivesMap.has(typeText.trim())

export const isContainer = (typeText: string): boolean => containersList.some(container => typeText.trim().startsWith(container))

const isValidDataType = (typeText: string): boolean => isPrimitive(typeText) || isContainer(typeText)

const isValidTypeAlias = (type: TypeNode | Node): boolean => type.getSourceFile().getTypeAliases().map(alias => alias.getNameNode().getText().trim()).includes(type.getText().trim())

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
  if (aliases.length === 0) {
    return []
  }

  const errs: Error[] = []
  for (const alias of aliases) {
    if (alias.getTypeParameters.length > 0) {
      errs.push(genericErr(alias))
    }
    errs.push(...validateTypeAliasChildren(alias))
  }
  return errs
}

const validateInterface = (interfc: InterfaceDeclaration): Error[] => {
  const errs: Error[] = []
  const interErr = (msg: string) => new Error(`error in file ${interfc.getSourceFile().getBaseName()}
    at line : ${interfc.getStartLineNumber()} .
    ${msg}`)
  if (interfc.getMethods().length === 0) {
    errs.push(interErr('all typerpc interfcaces must declare at least one method'))
  }
  if (interfc.getTypeParameters.length > 0) {
    errs.push(genericErr(interfc))
  }
  if (interfc.getExtends.length > 0) {
    errs.push(interErr('typerpc interface are not allowed to contain extends clauses'))
  }
  return errs
}

// Ensure at least one interface and no interfaces are generic
const validateInterfaces = (sourceFile: SourceFile): Error[] => {
  const interfaces = sourceFile.getInterfaces()
  if (interfaces.length === 0) {
    return [new  Error(`error in file => ${sourceFile.getBaseName()}. All typerpc schema files must contain at least one interface (service) definition`)]
  }

  return interfaces.flatMap(interfc => validateInterface(interfc))
}

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

const validateMethodNotGeneric = (method: MethodSignature): Error[] => method.getTypeParameters().length > 0 ? [genericErr(method)] : []

const getMethodsForFile = (file: SourceFile): MethodSignature[] => file.getInterfaces().flatMap(interfc => interfc.getMethods())
// Validates method params and return types.
const validateMethods = (sourceFile: SourceFile): Error[] => getMethodsForFile(sourceFile).flatMap(method => [...validateParams(method), ...validateReturnType(method), ...validateMethodNotGeneric(method)])

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

