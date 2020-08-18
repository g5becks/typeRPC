import {Code, CodeBuilder} from '..'
import {Method, Schema} from '../../schema'
import {capitalize, fileHeader} from '../utils'
import {Interface, TypeDef} from '../../schema'
import {dataType} from './helpers'

const handleOptional = (isOptional: boolean): string => isOptional ? '?' : ''
const buildProps = (type: TypeDef): string => {
  let props = ''
  for (const prop of type.properties) {
    props = props.concat(`${prop.name}${handleOptional(prop.isOptional)}: ${dataType(prop.type)}\n`)
  }
  return props
}
const buildType = (type: TypeDef): string => {
  return `
type ${capitalize(type.name)} = {
  ${buildProps(type)}
}\n`
}

const buildTypes = (schema: Schema): string => {
  let types =  ''
  for (const type of schema.types) {
    types = types.concat(buildType(type))
  }
  return types
}

const buildMethod = (method: Method): string => {

}
const buildInterface = (interfc: Interface): string => {
  return `
interface ${capitalize(interfc.name)} {

}\n`
}
const buildServer = (schema: Schema): Code => {
  const source = `
import Router from '@koa/router'
${fileHeader()}
${buildTypes(schema)}
`
  return {fileName: schema.fileName + '.ts', source}
}

const builder = (schemas: ReadonlySet<Schema>): ReadonlySet<Code> => new Set<Code>([...schemas].map(schema => buildServer(schema)))

export const KoaBuilder:  CodeBuilder = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  builder,
}
