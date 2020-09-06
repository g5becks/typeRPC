import { TypeRpcPlugin } from '@typerpc/plugin'

/**
 * Config for client side code generation
 *
 * @property {string} outputPath
 * @property {Array} plugins
 **/
export type ClientConfig = {
    outputPath: string
    plugins: (string | TypeRpcPlugin)[]
    useFormatter?: boolean
}

export type ServerConfig = {
    outputPath: string
    plugins: (string | TypeRpcPlugin)[]
    useFormatter?: boolean
}
export type Config = {
    client: ClientConfig
    server: ServerConfig
}
