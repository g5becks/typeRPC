import { Schema } from '@typerpc/schema'

export type Code = {
    readonly fileName: string
    readonly source: string
}

export type TypeRpcPlugin = (schemas: Schema[]) => Code[]
