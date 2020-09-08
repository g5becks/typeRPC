import { Schema } from '@typerpc/schema'

export type Code = {
    readonly fileName: string
    readonly source: string
}

export type TypeRpcPlugin = {
    scaffold: (outputPath: string) => Code[]
    build: (schemas: Schema[]) => Code[]
}
