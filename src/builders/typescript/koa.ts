import {Code, CodeBuilder} from '..'
import {Method, Schema} from '../../schema'
import {capitalize, fileHeader, lowerCase} from '../utils'
import {Interface, TypeDef} from '../../schema'
import {dataType} from './helpers'

const logger = `
interface ErrLogger {
  error(message: string, ...meta: any[]): void;
}

const defaultLogger: ErrLogger = {
  error(message: string, ...meta) {
    console.log(\`error occurred :\${message}, info: \${meta}\`)
  }
}`
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
export type ${capitalize(type.name)} = {
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
export interface ${capitalize(interfc.name)} {
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

const methodCall = (interfaceName: string, method: Method): string => {
  const invoke = ''
  if (!method.hasParams) {
    if (method.cborReturn) {
      return `
        const data = await encodeAsync(${interfaceName}.${method.name}())

      `
    }
  }
}

const buildHandler = (interfaceName: string, method: Method): string =>  {
  return `
router.${method.httpVerb.toLowerCase()}('${interfaceName}/${method.name}', /${method.name}, async ctx => {

	} )
`
}

const buildRoutes = (interfc: Interface): string => {
  return `
export const ${lowerCase(interfc.name)}Routes = (${lowerCase(interfc.name)}: ${capitalize(interfc.name)}, logger: ErrLogger = defaultLogger): Middleware<Koa.ParameterizedContext<any, Router.RouterParamContext>> => {
	const router = new Router<any, {}>({
		prefix: '/${interfc.name}/',
		sensitive: true
	})

	return router.routes()
}\n
`
}

const buildImports = (schema: Schema): string => {
  const cbor = `
import {
	decodeFirst,
	encodeAsync,
} from 'cbor'`
  const useCbor = schema.hasCbor ? cbor : ''
  return `
import Router, {Middleware} from '@koa/router'
${useCbor}
  `
}
const buildFile = (schema: Schema): Code => {
  const source = `
${buildImports(schema)}
${fileHeader()}
${logger}
${buildTypes(schema)}
${buildInterfaces(schema)}
`
  return {fileName: schema.fileName + '.ts', source}
}

const builder = (schemas: ReadonlySet<Schema>): ReadonlySet<Code> => new Set<Code>([...schemas].map(schema => buildFile(schema)))

export const KoaBuilder:  CodeBuilder = {
  lang: 'ts',
  target: 'server',
  framework: 'koa',
  builder,
}
