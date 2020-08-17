import {Code, CodeBuilder} from '..'
import {Schema} from '../../schema'

const buildServer = (schema: Schema): Code => {

}

const builder = (schemas: ReadonlySet<Schema>): ReadonlySet<Code> => new Set<Code>([...schemas].map(schema => buildServer(schema)))

export const KoaBuilder:  CodeBuilder = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  builder,
}
