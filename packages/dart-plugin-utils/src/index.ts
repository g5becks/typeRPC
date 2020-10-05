/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { capitalize, lowerCase } from '@typerpc/plugin-utils'
import {
  DataType,
  Import,
  is,
  make,
  Message,
  Method,
  MutationService,
  Param,

  QueryService,
  Schema
} from '@typerpc/schema'

export const typeMap: Map<string, string> = new Map<string, string>([
    [make.bool.type, 'bool'],
    [make.int8.type, 'int'],
    [make.uint8.type, 'int'],
    [make.int16.type, 'int'],
    [make.uint16.type, 'int'],
    [make.int32.type, 'int'],
    [make.uint32.type, 'int'],
    [make.int64.type, 'int'],
    [make.uint64.type, 'int'],
    [make.float32.type, 'double'],
    [make.float64.type, 'double'],
    [make.nil.type, 'null'],
    [make.str.type, 'String'],
    [make.dyn.type, 'dynamic'],
    [make.timestamp.type, 'DateTime'],
    [make.unit.type, 'void'],
    [make.blob.type, 'Uint8List'],
])

// Converts the input dataType into a typescript representation
export const dataType = (type: DataType, propName?: string, methodName?: string): string => {
    if (is.dataType(type) !== true) {
        throw new TypeError(`invalid data type: ${type.toString()}`)
    }

    if (is.scalar(type)) {
        const res = typeMap.get(type.type)
        if (!res) {
            throw new TypeError('invalid data type')
        }
        return res
    }

    if (is.map(type)) {
        return `Map<${dataType(type.keyType)}, ${dataType(type.valType)}>`
    }

    if (is.list(type)) {
        return `<${dataType(type.dataType)}>`
    }

    if (is.struct(type)) {
        return type.name
    }

    if (is.structLiteral(type)) {
        return propName
            ? `${capitalize(propName)}`
            : methodName
            ? `${capitalize(methodName)}`
            : 'Map<String, dynamic>'
    }

    if (is.tuple2(type)) {
        return `Tuple2<${dataType(type.item1)}, ${dataType(type.item2)}>`
    }

    if (is.tuple3(type)) {
        return `Tuple3<${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}>`
    }

    if (is.tuple4(type)) {
        return `Tuple4<${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}>`
    }

    if (is.tuple5(type)) {
        return `Tuple5<${dataType(type.item1)}, ${dataType(type.item2)}, ${dataType(type.item3)}, ${dataType(
            type.item4,
        )}, ${dataType(type.item5)}>`
    }

    return 'dynamic'
}

// returns a string representation of a function call used to
// convert parsed querystring scalar to correct ts type
export const scalarFromQueryParam = (paramName: string, type: DataType): string => {
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
export const handleOptional = (isOptional: boolean): string => (isOptional ? '@required' : '')

const propClassName = (msgName: string, propName: string): string => {
  return capitalize(msgName) + capitalize(propName) + 'Prop'
}
const buildMsgProps = (msg: Message): string => {

    let properties = ''
    for (const property of msg.properties) {
        // if the property is an anonymous msg, return the name of the built class
        properties = properties.concat(
            `${handleOptional(property.isOptional)} ${is.structLiteral(property.type) ? propClassName(msg.name, property.name): dataType(property.type)} ${lowerCase(property.name)},`,
        )
    }
    return properties
}

export const buildMsgClass = (msg: Message): string => {
    return `
@freezed
class ${capitalize(msg.name)} with _$${capitalize(msg.name)} {
   @JsonSerializable(explicitToJson: true)
   factory ${capitalize(msg.name)}({
      ${buildMsgProps(msg)}
   }) = _${capitalize(msg.name)};

   factory ${capitalize(msg.name)}.fromJson(Map<String, dynamic> json) =>
   _${capitalize(msg.name)}FromJson(json);
}
`
}

// converts all rpc.Msg in a schema into type aliases
export const buildTypes = (schema: Schema): string => {
    let types = ''
    for (const type of schema.messages) {
        types = types.concat(buildMsgClass(type))
        // dart does not anonymous structs or classes, so we must check for
        // struct literal properties build them before hand.
        for (const prop of type.properties) {
            if (is.structLiteral(prop.type)) {
              types = types.
            }
        }
    }
    return types
}

// builds all of the parameters of a method
export const buildParams = (params: ReadonlyArray<Param>): string => {
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
export const buildMethodSignature = (method: Method): string => {
    return `${lowerCase(method.name)}(${buildParams(method.params)}): Promise<${dataType(method.returnType)}>;
`
}

// builds an interface definition location a Schema Service
export const buildInterface = (svc: QueryService | MutationService): string => {
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
export const paramNames = (params: ReadonlyArray<Param>): string => {
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

// builds the import strings location a Schema's Imports list
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
