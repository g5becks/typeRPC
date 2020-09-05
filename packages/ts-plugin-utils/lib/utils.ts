import { DataType, Import, is, make, Message, Param, QueryService, Schema, StructLiteralProp } from '../../schema'
import { capitalize, lowerCase } from '../../plugin-utils/lib/utils'
import { Method, MutationService } from '../../schema/lib/schema'
import { Code } from '../../../src/builders'
import { format as prettier } from 'prettier'
import { ChildProcess, exec } from 'child_process'
// Maps typerpc messages to typescript data-messages
export const typeMap: Map<string, string> = new Map<string, string>([
    [make.bool.type, 'boolean'],
    [make.int8.type, 'number'],
    [make.uint8.type, 'number'],
    [make.int16.type, 'number'],
    [make.uint16.type, 'number'],
    [make.int32.type, 'number'],
    [make.uint32.type, 'number'],
    [make.int64.type, 'number'],
    [make.uint64.type, 'number'],
    [make.float32.type, 'number'],
    [make.float64.type, 'number'],
    [make.nil.type, 'null'],
    [make.str.type, 'string'],
    [make.dyn.type, 'any'],
    // Math.round(Date.now() / 1000)
    [make.timestamp.type, 'number'],
    [make.unit.type, 'void'],
    [make.blob.type, 'Uint8Array'],
])

const typeLiteral = (props: ReadonlyArray<StructLiteralProp>): string => {
    const now = Math.round(Date.now() / 1000)
    let properties = ''
    let i = 0
    while (i < props.length) {
        /* eslint-disable @typescript-eslint/no-use-before-define */
        properties = properties.concat(
            `${props[i].name}${props[i].isOptional ? '?' : ''}: ${dataType(props[i].type)}; `,
        )
        i++
        /* eslint-disable @typescript-eslint/no-use-before-define */
    }
    return `{${properties}}`
}

// Converts the input dataType into a typescript representation
export const dataType = (type: DataType): string => {
    if (is.dataType(type) !== true) {
        throw new TypeError(`invalid data type: ${type.toString()}`)
    }

    if (is.scalar(type)) {
        return typeMap.get(type.type)!
    }

    if (is.map(type)) {
        return `{[key: string]: ${dataType(type.valType)}}`
    }

    if (is.list(type)) {
        return `Array<${dataType(type.dataType)}>`
    }

    if (is.struct(type)) {
        return type.name
    }

    if (is.structLiteral(type)) {
        return typeLiteral(type.properties)
    }

    if (is.tuple2(type)) {
        return `[${dataType(type.item1)}, ${dataType(type.item2)}]`
    }

    if (is.tuple3(type)) {
        return `[${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}]`
    }

    if (is.tuple4(type)) {
        return `[${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(type.item4)}]`
    }

    if (is.tuple5(type)) {
        return `[${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}, ${dataType(type.item5)}]`
    }

    return 'any'
}

// returns a string representation of a function call used to
// convert parsed querystring scalar to correct ts type
const scalarFromQueryParam = (paramName: string, type: DataType): string => {
    // eslint-disable-next-line no-negated-condition
    if (!is.scalar(type)) {
        throw new Error(`${type.toString()} is not a valid QuerySvc parameter type`)
    } else {
        switch (type.type) {
            case make.str.type:
                return paramName
            case make.float32.type:
            case make.float64.type:
                return `parseFloat(${paramName})`
            case make.bool.type:
                return `Boolean(${paramName})`
            case make.timestamp.type:
                return `Date.parse(${paramName})`
            case make.int8.type:
            case make.uint8.type:
            case make.int16.type:
            case make.uint16.type:
            case make.int32.type:
            case make.uint32.type:
            case make.int64.type:
            case make.uint64.type:
                return `parseInt(${paramName})`
        }
    }
    return paramName
}

// returns a string representation of a function call used to
// convert parsed querystring param list to correct ts type
export const fromQueryString = (paramName: string, type: DataType): string => {
    if (is.scalar(type)) {
        return scalarFromQueryParam(paramName, type)
    }
    return is.list(type) ? `${paramName}.map(val => ${scalarFromQueryParam('val', type.dataType)})` : paramName
}

// add question mark to optional type alias property or method param if needed
export const handleOptional = (isOptional: boolean): string => (isOptional ? '?' : '')

// builds a type alias from an rpc.Msg
const buildType = (msg: Message): string => {
    return `
export type ${capitalize(msg.name)} = ${typeLiteral(msg.properties)}
`
}

// converts all rpc.Msg in a schema into type aliases
export const buildTypes = (schema: Schema): string => {
    let types = ''
    for (const type of schema.messages) {
        types = types.concat(buildType(type))
    }
    return types
}

// builds all of the parameters of a method
const buildParams = (params: ReadonlyArray<Param>): string => {
    let paramsString = ''
    for (let i = 0; i < params.length; i++) {
        const useComma = i === params.length - 1 ? '' : ','
        paramsString = paramsString.concat(
            `${params[i].name}${handleOptional(params[i].isOptional)}: ${dataType(params[i].type)}${useComma}`,
        )
    }
    return paramsString
}

// builds a single method signature for an interface
const buildMethodSignature = (method: Method): string => {
    return `${lowerCase(method.name)}(${buildParams(method.params)}): Promise<${dataType(method.returnType)}>;
`
}

// builds an interface definition from a Schema Service
const buildInterface = (svc: QueryService | MutationService): string => {
    let methodsString = ''
    for (const method of svc.methods) {
        methodsString = methodsString.concat(buildMethodSignature(method))
    }
    return `
export interface ${capitalize(svc.name)} {
  ${methodsString}
}\n`
}

// builds interfaces for all QuerySvc and MutationSvc in a schemaFile
export const buildInterfaces = (schema: Schema): string => {
    let services = ''
    for (const svc of schema.queryServices) {
        services = services.concat(buildInterface(svc))
    }
    for (const svc of schema.mutationServices) {
        services = services.concat(buildInterface(svc))
    }
    return services
}

// builds the param names list for a method E.G.
// name, age, gender
export const paramNames = (params: ReadonlyArray<Param>) => {
    if (params.length === 0) {
        return ''
    }
    let names = ''
    for (let i = 0; i < params.length; i++) {
        const useComma = i === params.length - 1 ? '' : ', '
        names = names.concat(`${params[i].name}${useComma}`)
    }
    return names
}

// used for building input params for methods and also to
// builds the type specifier for destructured parameters E.G.
// {name: string, age: number, gender: string}
export const buildParamsWithTypes = (params: ReadonlyArray<Param>): string => {
    if (params.length === 0) {
        return ''
    }
    let paramsTypeString = ''
    for (let i = 0; i < params.length; i++) {
        const useComma = i === params.length - 1 ? '' : ', '
        paramsTypeString = paramsTypeString.concat(
            `${params[i].name}${handleOptional(params[i].isOptional)}: ${dataType(params[i].type)}${useComma}`,
        )
    }
    return paramsTypeString
}

// makes a destructured parameters variable. E.G.
// const {name, age}: {name: string, age: number }
export const buildParamsVar = (params: ReadonlyArray<Param>): string =>
    `const {${paramNames(params)}}: {${buildParamsWithTypes(params)}}`

// builds the import strings from a Schema's Imports list
export const buildMsgImports = (imports: ReadonlyArray<Import>): string => {
    let importsStr = ''
    for (const imp of imports) {
        let msgs = ''
        let i = 0
        while (i < imp.messageNames.length) {
            msgs = msgs.concat(`${imp.messageNames[i]} ${i === imp.messageNames.length - 1 ? '' : ','}`)
            i++
        }
        importsStr = importsStr.concat(`import {${msgs}} from './${imp.fileName}'\n`)
    }
    return importsStr
}

export const format = (path: string): ChildProcess =>
    exec(
        `prettier --single-quote --trailing-comma es5 --no-semi --parser typescript --write "${path}/**/*.ts"`,
        (error, stdout, stderr) => {
            if (error) {
                // eslint-disable-next-line no-console
                console.log(`error: ${error.message}`)
                return
            }
            if (stderr) {
                // eslint-disable-next-line no-console
                console.log(`stderr: ${stderr}`)
                return
            }
            // eslint-disable-next-line no-console
            console.log(`prettier formatted following files: ${stdout}`)
        },
    )
