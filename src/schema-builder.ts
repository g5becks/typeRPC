import {Node, SourceFile, TypeNode} from 'ts-morph'
import {t} from '@typerpc/types'
import {DataType, make, primitives} from './schema/types'
import {Parser} from './parser'
import {Target} from './schema/builder'

const primitivesMap = new Map<string, t.Primitive>(
  Object.entries(primitives).map(([_, v]) => [v.toString(), v])
)

const containersList = ['t.Dict', 't.Tuple2', 't.Tuple3', 't.Tuple4', 't.Tuple5', 't.List']

const isPrimitive = (type: TypeNode | Node): boolean => primitivesMap.has(type.getText().trim())

const isContainer = (type: TypeNode | Node): boolean => containersList.some(container => type.getText().trim().startsWith(container))

const isType = (type: TypeNode | Node, typeText: string): boolean => type.getText().trim().startsWith(typeText)

const makeList = (type: TypeNode | Node): t.List => make
.List(makeDataType(type.getChildAtIndex(2)))

const makeDict = (type: TypeNode | Node): t.Dict => make.Dict(primitivesMap.get(type.getChildAtIndex(1).getText().trim()) as t.Comparable, makeDataType(type.getChildAtIndex(2)))

// These makeTuple Functions contain lots of duplication, but also feel like they need to be
// defined strictly. Explore alternatives in the future.
const makeTuple2 = (type: TypeNode | Node): t.Tuple2 => make.Tuple2(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)))

const makeTuple3 = (type: TypeNode | Node): t.Tuple3 => make.Tuple3(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)), makeDataType(type.getChildAtIndex(3)))

const makeTuple4 = (type: TypeNode | Node): t.Tuple4 => make.Tuple4(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)), makeDataType(type.getChildAtIndex(3)), makeDataType(type.getChildAtIndex(4)))

const makeTuple5 = (type: TypeNode | Node): t.Tuple5 => make.Tuple5(makeDataType(type.getChildAtIndex(1)), makeDataType(type.getChildAtIndex(2)), makeDataType(type.getChildAtIndex(3)), makeDataType(type.getChildAtIndex(4)), makeDataType(type.getChildAtIndex(5)))

const makeDataType = (type: TypeNode | Node): DataType => {
  const typeText = type.getText().trim()
  if (isPrimitive(type)) {
    return primitivesMap.get(typeText) as DataType
  }
  if (!isContainer(type)) {
    return make.Struct(typeText)
  }
  if (isType(type, 't.List')) {
    return makeList(type)
  }
  if (isType(type, 't.Dict')) {
    return makeDict(type)
  }
  if (isType(type, 't.Tuple2')) {
    return makeTuple2(type)
  }
  if (isType(type, 't.Tuple3')) {
    return makeTuple3(type)
  }
  if (isType(type, 't.Tuple4')) {
    return makeTuple4(type)
  }
  if (isType(type, 't.Tuple5')) {
    return makeTuple5(type)
  }

  return primitives.dyn
}

export class SchemaBuilder {
  private readonly parser: Parser

  private readonly sourceFiles: SourceFile[]

  private constructor(protected readonly target: Target, protected readonly tsConfigFilePath: string, protected readonly outputPath: string) {
    this.parser = new Parser(tsConfigFilePath)
    this.sourceFiles = this.parser.sourceFiles
  }

  public static create(target: Target, tsConfigFilePath: string, outputPath: string): SchemaBuilder | Error[] {
    const builder = new SchemaBuilder(target,tsConfigFilePath,outputPath)
    let errs: Error[] = []
    for (const file of builder.sourceFiles) {
      errs.push(...builder.validateSchema(file))
    }
    if (errs.length) {
      return errs
    }
    return builder
  }

  private validateSchema(sourceFile: SourceFile): Error[] {


  }
}
