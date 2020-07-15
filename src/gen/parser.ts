import {pathExists} from 'fs-extra'
import {InterfaceDeclaration, MethodSignature, ParameterDeclaration, Project, SourceFile, ts, Type, TypeAliasDeclaration} from 'ts-morph'
import * as TJS from 'typescript-json-schema'

/**
 * Parses specified project source code files
 *
 * @export
 * @class Parser
 */
export class Parser {
  public readonly project: Project

  private get program() {
    return TJS.getProgramFromFiles(this.sourceFiles.map(file => file.getFilePath()))
  }

  public get sourceFiles() {
    return this.project.getSourceFiles()
  }

  public get jsonSchemaGenerator() {
    return TJS.buildGenerator(this.program)
  }

  private constructor(private readonly tsConfigFilePath: string) {
    this.project = new Project({tsConfigFilePath: this.tsConfigFilePath})
  }

  public static async create(tsConfigFilePath: string): Promise<string | Parser> {
    try {
      const exists = await pathExists(tsConfigFilePath)
      if (!exists) {
        return `error: ${tsConfigFilePath} does not exist, please provide a valid tsconfig.json file`
      }
      return new Parser(tsConfigFilePath)
    } catch (error) {
      return `error occurred: ${error}, please try running the command again`
    }
  }

  getMethodsForInterface(interfce: InterfaceDeclaration): MethodSignature[] {
    return interfce.getMethods()
  }

  getMethodsForFile(file: SourceFile): MethodSignature[] {
    const interfaces = this.getInterfaces(file)
    const methods: MethodSignature[] = []
    interfaces.forEach(interfc => methods.push(...this.getMethodsForInterface(interfc)))
    return methods
  }

  getParams(method: MethodSignature): ParameterDeclaration[] {
    return method.getParameters()
  }

  getMethodReturnType(method: MethodSignature): Type<ts.Type> {
    return method.getReturnType()
  }

  getMethodName(method: MethodSignature): string {
    return method.getName()
  }

  getFileName(file: SourceFile): string  {
    return file.getBaseName()
  }

  getInterfaces(file: SourceFile): InterfaceDeclaration[] {
    return file.getInterfaces()
  }

  getTypeAliases(file: SourceFile): TypeAliasDeclaration[] {
    return file.getTypeAliases()
  }

  getAllReturnTypes(file: SourceFile): Type<ts.Type>[] {
    return this.getMethodsForFile(file).map(method => this.getMethodReturnType(method))
  }
}

