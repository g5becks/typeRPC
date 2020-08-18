import {Code, CodeBuilder} from '..'
import {Method, Schema} from '../../schema'
import {capitalize, fileHeader, lowerCase} from '../utils'
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

const buildParams = (method: Method): string => {
  let params = ''
  const optionals = [...method.params].filter(param => param.isOptional)
  const sorted = [...method.params].filter(param => !param.isOptional).concat(optionals)
  for (let i = 0; i < sorted.length; i++) {
    const useComma = i === sorted.length - 1 ? '' : ','
    params = params.concat(`${sorted[i].name}: ${dataType(sorted[i].type)}${useComma}`)
  }
  return params
}

const buildMethod = (method: Method): string => {
  return `async ${lowerCase(method.name)}(${buildParams(method)}): Promise<${dataType(method.returnType)}>;\n`
}

const buildMethods = (interfc: Interface): string => {
  let methods = ''
  for (const method of interfc.methods) {
    methods = methods.concat(buildMethod(method))
  }
  return methods
}

const buildInterface = (interfc: Interface): string => {
  return `
interface ${capitalize(interfc.name)} {
  ${buildMethods(interfc)}
}\n`
}

const buildInterfaces = (schema: Schema): string => {
  let interfaces = ''
  for (const interfc of schema.interfaces) {
    interfaces = interfaces.concat(buildInterface(interfc))
  }
  return interfaces
}
const buildServer = (schema: Schema): Code => {
  const source = `
import Router from '@koa/router'
${fileHeader()}
${buildTypes(schema)}
${buildInterfaces(schema)}
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
