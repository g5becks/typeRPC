import {ImportDeclaration, SourceFile, SyntaxKind, TypeAliasDeclaration} from 'ts-morph'
import {
  isMsg,
  isMutationSvc,
  isQuerySvc,
  multiValidationErr,
  singleValidationErr,
  validateNotGeneric,
  Violator,
} from './utils'
import {validateMessages} from './message'

const validate = (declarations: Violator[]): Error[] => declarations.length > 0 ? [multiValidationErr(declarations)] : []
// Ensure zero function declarations
const validateFunctions = (file: SourceFile): Error[] => validate(file.getFunctions())

// Ensure zero variable declarations
const validateVariables = (file: SourceFile): Error[] => validate(file.getVariableDeclarations())

// Ensure Zero Interfaces
const validateInterfaces = (file: SourceFile): Error[] => validate(file.getInterfaces())

// Ensure zero class declarations
const validateClasses = (file: SourceFile): Error[] => validate(file.getClasses())

const validateImports = (file: SourceFile, projectFiles: SourceFile[]): Error[] => {
  const imports = file.getImportDeclarations()
  // eslint-disable-next-line no-useless-concat
  const err = (i: ImportDeclaration, msg: string) => singleValidationErr(i, 'invalid import declaration : ' + i.getText() + '\n' + ` reason: ${msg}`)
  let errs: Error[] = []
  for (const imp of imports) {
    if (typeof imp.getModuleSpecifierSourceFile() === 'undefined') {
      errs = errs.concat(err(imp, 'module specifier is undefined'))
    } else if (imp.getModuleSpecifierValue() !== '@typerpc/types' && !projectFiles.includes(imp.getModuleSpecifierSourceFile()!)) {
      errs = errs.concat(err(imp, `${imp.getModuleSpecifierSourceFile()?.getFilePath().toString()} is not a part of this project`))
    } else if (typeof imp.getImportClause() === 'undefined') {
      errs = errs.concat(err(imp, 'import clause is undefined'))
      // eslint-disable-next-line brace-style
    }
    // validate node default or namespace import
    else if (typeof imp.getDefaultImport() !== 'undefined' || typeof imp.getNamespaceImport() !== 'undefined') {
      errs = errs.concat(singleValidationErr(imp, 'invalid import statement. typerpc only allows named imports'))
    } else {
      const module = imp.getModuleSpecifierValue()
      // validates that the import is located in the same directory by checking
      // that the import starts with ./ and there is only a single slash.
      if (module !== '@typerpc/types' && !module.startsWith('./') && module.split('/').length !== 2) {
        errs = errs.concat(singleValidationErr(imp, 'invalid import. Only files located in the same directory are allowed'))
      }
      // validate no aliased imports
      for (const name of imp.getNamedImports()) {
        if (typeof name.getAliasNode() !== 'undefined') {
          errs = errs.concat(singleValidationErr(name, 'import aliasing not allowed'))
        }
      }
    }
  }
  return errs
}

const validateExports = (file: SourceFile): Error[] => {
  let errs: Error[] = []
  const exportErr = (exportType: string) => new Error(`${exportType} found in file ${file.getFilePath().toString()} ${exportType}s are not allowed. Try using an export declaration of the form 'export type SomeType' instead. Note: only rpc.Msg types are allowed to be exported`)
  const exported = file.getExportedDeclarations()
  // validate no default exports.
  if (typeof file.getDefaultExportSymbol() !== 'undefined') {
    errs = errs.concat(exportErr('default export'))
  }
  // validate no export assignments. E.G. export =
  if (file.getExportAssignments().length !== 0) {
    errs = errs.concat(exportErr('export assignment'))
  }
  // validate no export lists. E.G. export {name, var, etc}
  if (file.getExportDeclarations().length !== 0) {
    errs = errs.concat(exportErr('export list'))
  }
  // validate only rpc.Msg is exported
  if (exported.size > 0) {
    for (const v of exported.values()) {
      if (v.length !== 1) {
        errs = errs.concat(exportErr('invalid export declaration'))
      }
      for (const type of v) {
        if (!type.getFirstChildByKind(SyntaxKind.TypeReference)?.getText().startsWith('rpc.Msg<{')) {
          errs = errs.concat(exportErr('non rpm.Msg type'))
        }
      }
    }
  }

  return errs
}

// Ensure zero namespaces
const validateNameSpaces = (file: SourceFile): Error[] => validate(file.getNamespaces())

// Ensure zero top level statements
const validateStatements = (file: SourceFile): Error[] => {
  const stmnts = file.getStatements()
  const invalidKinds = [SyntaxKind.AbstractKeyword, SyntaxKind.AwaitExpression, SyntaxKind.ArrayType, SyntaxKind.ArrowFunction, SyntaxKind.TaggedTemplateExpression, SyntaxKind.SpreadAssignment, SyntaxKind.JsxExpression, SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.SwitchStatement, SyntaxKind.LessThanLessThanEqualsToken]
  const invalids = stmnts.filter(stmnt => invalidKinds.includes(stmnt.getKind()))
  return invalids.length > 0 ? [multiValidationErr(invalids)] : []
}
// Ensure zero enums
const validateEnums = (file: SourceFile): Error[] => validate(file.getEnums())

// Ensure zero references to other files
const validateRefs = (file: SourceFile): Error[] => {
  const errs: Error[] = []
  // should be 1
  const nodeSourceRefs = file.getNodesReferencingOtherSourceFiles()
  if (nodeSourceRefs.length !== 1) {
    errs.push(multiValidationErr(nodeSourceRefs))
  }
  // should be 1
  const literalSourceRefs = file.getLiteralsReferencingOtherSourceFiles()
  if (literalSourceRefs.length !== 1) {
    errs.push(multiValidationErr(literalSourceRefs))
  }
  // should be 1
  const sourceRefs = file.getReferencedSourceFiles()
  if (sourceRefs.length !== 1) {
    errs.push(multiValidationErr(sourceRefs))
  }
  const otherErr = (msg: string) => new Error(`error in file: ${file.getFilePath().toString()
  }
  message: ${msg}`)
  // should be 0
  const libraryRefs = file.getLibReferenceDirectives()
  if (libraryRefs.length > 0) {
    errs.push(otherErr('library reference found'))
  }
  // should be 0
  const pathRefs = file.getPathReferenceDirectives()
  if (pathRefs.length > 0) {
    errs.push(otherErr('path reference found'))
  }
  // should be 0
  const typeDirRefs = file.getTypeReferenceDirectives()
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
  // eslint-disable-next-line no-negated-condition
  return tags[0].getComment() !== 'cbor' ? [singleValidationErr(tags[0], `there is only one valid comment for the @kind tag (cbor), found ${tags[0].getComment()}`)] : []
}

// Runs a pre-validation step on all type aliases found in a schema file
// to ensure they are eligible to move forward into the next validation stage.
// This check ensures the type is either an rpc.QueryService or rpc.Msg,
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
  if (!isMsg(type) && isQuerySvc(type) && isMutationSvc(type)) {
    errs = errs.concat(singleValidationErr(type, 'typerpc schema files can only declare rpc.Msg, rpc.QuerySvc and rpc.MutationSvc definitions.'))
  }

  errs = [...errs, ...validateNotGeneric(type), ...(validateJsDoc(type))]

  return errs
}

const validateTypes = (file: SourceFile): Error[] =>
  file.getTypeAliases().flatMap(alias => preValidateType(alias))

export const validateDeclarations = (file: SourceFile, projectFiles: SourceFile[]): Error[] => {
  return [...validateFunctions(file),
    ...validateVariables(file),
    ...validateInterfaces(file),
    ...validateClasses(file),
    ...validateImports(file, projectFiles),
    ...validateExports(file),
    ...validateNameSpaces(file),
    ...validateStatements(file),
    ...validateEnums(file),
    ...validateRefs(file),
    ...validateTypes(file)]
}

export const internal = {
  validateTypes,
  validateJsDoc,
  validateExports,
  validateImports,
  validateEnums,
  validateNameSpaces,
  validateClasses,
  validateStatements,
  validateVariables,
  validateInterfaces,
  validateFunctions,
  validateMessages,

}

