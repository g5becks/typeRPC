import {MethodSignature, Node, SourceFile, TypeNode} from 'ts-morph'
import {containersList, primitivesMap} from './types'
import {getMethodsForFile} from '../parser'

const errMsg = (numInvalids: number, type: string, violators: string[], sourceFile: SourceFile) =>
  `${sourceFile.getBaseName()} contains ${numInvalids} ${type} declarations => ${violators}. typerpc schemas can only contain typeAlias => (message) and interface => (service) declarations.`

// Ensure zero function declarations
const validateFunctions =  (sourceFile: SourceFile): Error[] => {
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
export const isPrimitive = (type: TypeNode | Node): boolean => primitivesMap.has(type.getText().trim())

export const isContainer = (type: TypeNode | Node): boolean => containersList.some(container => type.getText().trim().startsWith(container))

const isValidDataType = (type: TypeNode | Node): boolean => isPrimitive(type) || isContainer(type)

const validateParams = (method: MethodSignature, types: string[]): Error[] {
  if (!method.getParameters()) {
    return []
  }
  const paramTypes = method.getParameters().map(param => param.getTypeNode())
    let errs: Error[] = []
  for (const type of paramTypes) {
    if (typeof type !== 'undefined') {
      errs.push(new Error(`error in file: ${type.getSourceFile().getBaseName()} at: ${type.getEndLineNumber()}, all method paramaters must have a type`))
    }
    if (!isValidDataType()) {

    }
  }

}
const validateMethods = (sourceFile: SourceFile): Error[] => {
  const methods = getMethodsForFile(sourceFile)
  const types = sourceFile.getTypeAliases().map(alias => alias.getName().trim())
}

const validateSchema = (sourceFile: SourceFile): Error[] => {
  return [...validateFunctions(sourceFile), ...validateVariables(sourceFile), ...validateImports(sourceFile), ...validateClasses(sourceFile)]
}

export const validateSchemas = (schemas: SourceFile[]): Error[] => {
  const errs: Error[] = []
  for (const schema of schemas) {
    errs.push(...validateSchema(schema))
  }
  return errs
}
