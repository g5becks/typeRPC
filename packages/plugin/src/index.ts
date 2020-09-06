import { Schema } from '@typerpc/schema'

export type Code = {
    readonly fileName: string
    readonly source: string
}

export type TypeRpcPlugin = {
    readonly build: (schemas: Schema[]) => Code[]
    readonly format?: (path: string) => void
}

export const isValidPlugin = (plugin: any): plugin is TypeRpcPlugin => 'build' in plugin
