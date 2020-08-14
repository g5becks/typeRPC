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

type Violator = {
  name?: string;
  lineNumber?: number;
}
const err = (numInvalids: number, type: string, violators: Violator[], sourceFile: SourceFile): Error =>
  new Error(`${sourceFile.getFilePath().toString()} contains ${numInvalids} ${type} declarations
   errors: ${violators.map(vio => String(vio?.name) + ', at line number: ' + String(vio?.lineNumber) + '\n')}
   message: typerpc schemas can only contain a single import statement (import {t} from '@typerpc/types'), typeAlias (message), and interface (service) declarations.`)

// Ensure zero function declarations
const validateFunctions = (sourceFile: SourceFile): Error[] => {
  const functions = sourceFile.getFunctions()
  return functions.length > 0 ? [err(functions.length, 'function', functions.map(func => {
    return {name: func.getName(), lineNumber: func.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero variable declarations
const validateVariables = (sourceFile: SourceFile): Error[] => {
  const variables = sourceFile.getVariableDeclarations()
  return variables.length > 0 ? [err(variables.length, 'variable', variables.map(vari => {
    return {name: vari.getName(), lineNumber: vari.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero class declarations
const validateClasses = (sourceFile: SourceFile): Error[] => {
  const classes = sourceFile.getClasses()
  return classes.length > 0 ? [err(classes.length, 'class', classes.map(cls => {
    return {name: cls.getName(), lineNumber: cls.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure only one valid import without aliasing the namespace
const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0]?.getImportClause()?.getNamedImports()[0].getText().trim()
  const errs: Error[] = []
  if (imports.length !== 1) {
    errs.push(
      new Error(`error in file ${sourceFile.getFilePath().toString()}
       message: typerpc schema files must contain only one import declaration => import {t} from '@typerpc/types'`)
    )
  } else if (imports[0].getImportClause()?.getNamedImports()[0].getText().trim() !== 't') {
    errs.push(new Error(`error in file ${sourceFile.getFilePath()}
     at line number: ${imports[0]?.getStartLineNumber()}
     message: Invalid import statement => ${imp}, @typerpc/types namespace can only be imported as {t}`))
  }
  return errs
}

// Ensure zero exports
const validateExports = (sourceFile: SourceFile): Error[] => {
  const allExports = sourceFile.getExportAssignments()
  const exportDecs = sourceFile.getExportDeclarations()
  const exportSym = sourceFile.getExportSymbols()
  const errs = allExports.length > 0 ? [err(allExports.length, 'export', allExports.map(exp => {
    return {name: exp.getText().trim()}
  }), sourceFile)] : []
  if (exportDecs.length > 0) {
    errs.push(err(exportDecs.length, 'export', exportDecs.map(exp => {
      return {name: exp.getText().trim(), lineNumber: exp.getStartLineNumber()}
    }), sourceFile))
  }
  if (exportSym.length > 0) {
    errs.push(err(exportSym.length, 'export', exportSym.map(exp => {
      return {name: exp.getName()}
    }), sourceFile))
  }
  return errs
}

// Ensure zero namespaces
const validateNameSpaces = (sourceFile: SourceFile): Error[] => {
  const spaces = sourceFile.getNamespaces()
  return spaces.length > 0 ? [err(spaces.length, 'namespace', spaces.map(space => {
    return {name: space.getName(), lineNumber: space.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero top level statements
const validateStatements = (sourceFile: SourceFile): Error[] => {
  const stmnts = sourceFile.getStatements()
  const invalidKinds = [SyntaxKind.AbstractKeyword, SyntaxKind.AwaitExpression, SyntaxKind.ArrayType, SyntaxKind.ArrowFunction,  SyntaxKind.TaggedTemplateExpression, SyntaxKind.SpreadAssignment, SyntaxKind.JsxExpression, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.SwitchStatement]
  const invalids = stmnts.filter(stmnt => invalidKinds.includes(stmnt.getKind()))
  return invalids.length > 0 ? [err(stmnts.length, 'top level statement', invalids.map(stmnt => {
    return {name: stmnt.getText().trim(), lineNumber: stmnt.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure no enums
const validateEnums = (sourceFile: SourceFile): Error[] => {
  const enums = sourceFile.getEnums()
  return enums.length > 0 ? [err(enums.length, 'enum', enums.map(enu => {
    return {name: enu.getName(), lineNumber: enu.getStartLineNumber()}
  }), sourceFile)] : []
}

// Ensure zero references to other files
const validateRefs = (sourceFile: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = sourceFile.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(err(nodeSourceRefs.length - 1, 'source reference', nodeSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => {
      return {name: ref.getText().trim(), lineNumber: ref.getStartLineNumber()}
    }), sourceFile))
  }
  // should be 1
  const literalSourceRefs = sourceFile.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(err(literalSourceRefs.length - 1, 'literal source reference', literalSourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => {
      return {name: ref.getText().trim(), lineNumber: ref.getStartLineNumber()}
    }), sourceFile))
  }
  // should be 1
  const sourceRefs = sourceFile.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(err(sourceRefs.length - 1, 'source reference', sourceRefs.filter(ref => !ref.getText().includes('@typerpc')).map(ref => {
      return {name: ref.getText().trim(), lineNumber: ref.getStartLineNumber()}
    }), sourceFile))
  }
  // should be 0
  const libraryRefs = sourceFile.getLibReferenceDirectives()
  if (libraryRefs.length > 0) {
    errs.push(err(libraryRefs.length, 'library reference', libraryRefs.map(ref => {
      return {name: ref.getText().trim()}
    }), sourceFile))
  }
  // should be 0
  const pathRefs = sourceFile.getPathReferenceDirectives()
  if (pathRefs.length > 0) {
    errs.push(err(pathRefs.length, 'path reference', pathRefs.map(ref => {
      return {name: ref.getText().trim()}
    }), sourceFile))
  }
  // should be 0
  const typeDirRefs = sourceFile.getTypeReferenceDirectives()
  if (typeDirRefs.length > 0) {
    errs.push(err(typeDirRefs.length, 'type reference directive', typeDirRefs.map(ref => {
      return {name: ref.getText().trim()}
    }), sourceFile))
  }
  return errs
}

const genericErr = (type: TypeAliasDeclaration | InterfaceDeclaration | MethodSignature): Error => new Error(`typeError at: ${type.getStartLineNumber()}
 message: ${type.getName().trim()} defines a generic type . typerpc types  cannot be generic`)

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
    errs.push(new Error(`type error in file ${type.getSourceFile()?.getFilePath().toString()}
    at line number: ${type.getStartLineNumber()}
    message:  Empty type aliases are not supported`))
  } else {
    for (const child of children) {
      // get the properties type
      const propType = child.getChildAtIndex(2)
      if (!isValidDataType(propType.getText().trim()) && !isValidTypeAlias(propType)) {
        errs.push(new Error(`type error in file: ${child.getSourceFile().getFilePath().toString()}
         at line number: ${child.getStartLineNumber()}
         message: Invalid property type, Only types imported from @typerpc/types and other type aliases declared in the same file may be used as property types`))
      }
    }
  }
  return errs
}

const validateTypeAlias = (type: TypeAliasDeclaration): Error[] => {
  return type.getTypeParameters().length > 0 ? [genericErr(type)] : []
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
  const interErr = (msg: string) => new Error(`error in file ${interfc.getSourceFile().getFilePath().toString()}
    at line number : ${interfc.getStartLineNumber()}
    message: ${msg}`)
  if (interfc.getMethods().length === 0) {
    errs = errs.concat(interErr('all typerpc interfcaces must declare at least one method'))
  }
  if (interfc.getTypeParameters().length > 0) {
    errs = errs.concat(genericErr(interfc))
  }
  if (interfc.getExtends().length > 0) {
    errs = errs.concat(interErr('typerpc interface are not allowed to contain extends clauses'))
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
  const paramErr = (type: TypeNode | undefined, msg: string) => new Error(`error in file: ${type?.getSourceFile().getFilePath().toString()}
   at line number: ${type?.getStartLineNumber()}
   message: ${msg}`)
  const paramTypes = method.getParameters().map(param => param.getTypeNode())
  const errs: Error[] = []
  for (const type of paramTypes) {
    if (typeof type === 'undefined') {
      errs.push(paramErr(type, `${method.getName()} contains one or more parameters that do not specify a valid type. All method parameter must have a valid type`))
    } else if (!isValidDataType(type.getText()) && !isValidTypeAlias(type)) {
      errs.push(paramErr(type, `typeError = ${type} is either not a valid typerpc type or it's type is not defined in this file`))
    }
  }
  return errs
}

// Ensures return type of a method is either a valid typerpc type or a type
// declared in the same file.
const validateReturnType = (method: MethodSignature): Error[] => {
  const returnType = method.getReturnTypeNode()
  const returnTypeErr = (typeName: string) => new Error(`typerc error in file ${method.getSourceFile().getFilePath().toString()}
   at line number: ${method.getStartLineNumber()}
   message: All typerpc interface methods must contain a valid return type. Invalid return type: ${typeName}`)
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

