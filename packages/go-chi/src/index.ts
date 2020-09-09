import { Code, TypeRpcPlugin } from '@typerpc/plugin'
import { generate } from './generate'
import { scaffold } from './scaffold'

const plugin: TypeRpcPlugin = {
    generate,
    scaffold,
}

export default plugin
