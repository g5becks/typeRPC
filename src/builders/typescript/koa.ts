import {Code, CodeBuilder} from '..'
import {Schema} from '../../schema'
import {fileHeader} from '../utils'
import {TypeDef} from '../../schema/schema'

const buildType = (type: TypeDef): string => {
  return `
type ${type.}=  `
}
const buildServer = (schema: Schema): Code => {
  const source = `
import Router from '@koa/router'
${fileHeader()}`
  return {fileName: schema.fileName + '.ts', source}
}

const builder = (schemas: ReadonlySet<Schema>): ReadonlySet<Code> => new Set<Code>([...schemas].map(schema => buildServer(schema)))

export const KoaBuilder:  CodeBuilder = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  builder,
}
