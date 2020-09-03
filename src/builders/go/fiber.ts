import {Code, CodeBuilder} from '..'
import {Schema} from '../../schema'
import {buildFileName, buildInterfaces, buildTypes} from './utils'

const buildFile = (schema: Schema): Code => {
  return {fileName: buildFileName(schema.fileName), source:
  `
package ${schema.packageName}

${buildTypes(schema.messages)}
${buildInterfaces(schema)}
`}
}
const build = (schemas: Schema[]): Code[] => schemas.map(schema => buildFile(schema))
export const FiberBuilder: CodeBuilder = {
  build,
  framework: 'fiber',
  lang: 'go',
  target: 'server',

}
