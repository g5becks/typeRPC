import {SourceFile} from 'ts-morph'

const errMsg = (numInvalids: number, type: string, violators: string[], sourceFile: SourceFile) =>
  `${sourceFile.getBaseName()} contains ${numInvalids} ${type} declarations: ${violators} type rpc schemas can only contain typeAlias => (message) and interface => (service) declarations.`

const validateFunctions =  (sourceFile: SourceFile): Error[] => {
  const functions = sourceFile.getFunctions()
  return functions.length ? [new Error(errMsg(functions.length, 'function', functions.map(func => func.getName() ?? ''), sourceFile))] : []
}

const validateVariables = (sourceFile: SourceFile): Error[] => {
  const variables = sourceFile.getVariableDeclarations()
  return variables.length ? [new Error(`${sourceFile.getBaseName()} contains ${variables.length} variable declarations`)] : []
}

const validateClasses = (sourceFile: SourceFile): Error[] => {
  const classes = sourceFile.getClasses()
  return classes.length ? [new Error(errMsg(classes.length, 'class', classes.map(cls => cls.getName() ?? ''), sourceFile))] : []
}

const validateImports = (sourceFile: SourceFile): Error[] => {
  const imports = sourceFile.getImportDeclarations()
  const imp = imports[0].getImportClause()?.getNamedImports()[0].getText().trim()
  const errs: Error[] = []
  if (imports.length !== 1) {
    errs.push(
      new Error('typerpc schema files must contain only one import declaration => import {t} from \'@typerpc/types\'')
    )
  } else if (imports[0].getImportClause()?.getNamedImports()[0].getText().trim() !== 't') {
    errs.push(new Error(`invalid import statement => ${imp}, types namespace can only be imported as {t}`))
  }
  return errs
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
