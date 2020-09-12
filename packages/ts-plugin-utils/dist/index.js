"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMsgImports = exports.buildParamsVar = exports.buildParamsWithTypes = exports.paramNames = exports.buildInterfaces = exports.buildInterface = exports.buildMethodSignature = exports.buildParams = exports.buildTypes = exports.buildType = exports.handleOptional = exports.fromQueryString = exports.scalarFromQueryParam = exports.dataType = exports.typeLiteral = exports.typeMap = void 0;
const schema_1 = require("@typerpc/schema");
const plugin_utils_1 = require("@typerpc/plugin-utils");
exports.typeMap = new Map([
    [schema_1.make.bool.type, 'boolean'],
    [schema_1.make.int8.type, 'number'],
    [schema_1.make.uint8.type, 'number'],
    [schema_1.make.int16.type, 'number'],
    [schema_1.make.uint16.type, 'number'],
    [schema_1.make.int32.type, 'number'],
    [schema_1.make.uint32.type, 'number'],
    [schema_1.make.int64.type, 'number'],
    [schema_1.make.uint64.type, 'number'],
    [schema_1.make.float32.type, 'number'],
    [schema_1.make.float64.type, 'number'],
    [schema_1.make.nil.type, 'null'],
    [schema_1.make.str.type, 'string'],
    [schema_1.make.dyn.type, 'any'],
    // Math.round(Date.now() / 1000)
    [schema_1.make.timestamp.type, 'number'],
    [schema_1.make.unit.type, 'void'],
    [schema_1.make.blob.type, 'Uint8Array'],
]);
exports.typeLiteral = (props) => {
    let properties = '';
    let i = 0;
    while (i < props.length) {
        /* eslint-disable @typescript-eslint/no-use-before-define */
        properties = properties.concat(`${props[i].name}${props[i].isOptional ? '?' : ''}: ${exports.dataType(props[i].type)}; `);
        i++;
        /* eslint-disable @typescript-eslint/no-use-before-define */
    }
    return `{${properties}}`;
};
// Converts the input dataType into a typescript representation
exports.dataType = (type) => {
    if (schema_1.is.dataType(type) !== true) {
        throw new TypeError(`invalid data type: ${type.toString()}`);
    }
    if (schema_1.is.scalar(type)) {
        const res = exports.typeMap.get(type.type);
        if (!res) {
            throw new TypeError('invalid data type');
        }
        return res;
    }
    if (schema_1.is.map(type)) {
        return `{[key: string]: ${exports.dataType(type.valType)}}`;
    }
    if (schema_1.is.list(type)) {
        return `Array<${exports.dataType(type.dataType)}>`;
    }
    if (schema_1.is.struct(type)) {
        return type.name;
    }
    if (schema_1.is.structLiteral(type)) {
        return exports.typeLiteral(type.properties);
    }
    if (schema_1.is.tuple2(type)) {
        return `[${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}]`;
    }
    if (schema_1.is.tuple3(type)) {
        return `[${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}]`;
    }
    if (schema_1.is.tuple4(type)) {
        return `[${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}, ${exports.dataType(type.item4)}]`;
    }
    if (schema_1.is.tuple5(type)) {
        return `[${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}, ${exports.dataType(type.item4)}, ${exports.dataType(type.item5)}]`;
    }
    return 'any';
};
// returns a string representation of a function call used to
// convert parsed querystring scalar to correct ts type
exports.scalarFromQueryParam = (paramName, type) => {
    // eslint-disable-next-line no-negated-condition
    if (!schema_1.is.scalar(type)) {
        throw new Error(`${type.toString()} is not a valid QuerySvc parameter type`);
    }
    else {
        switch (type.type) {
            case schema_1.make.str.type:
                return paramName;
            case schema_1.make.float32.type:
            case schema_1.make.float64.type:
                return `parseFloat(${paramName})`;
            case schema_1.make.bool.type:
                return `Boolean(${paramName})`;
            case schema_1.make.timestamp.type:
                return `Date.parse(${paramName})`;
            case schema_1.make.int8.type:
            case schema_1.make.uint8.type:
            case schema_1.make.int16.type:
            case schema_1.make.uint16.type:
            case schema_1.make.int32.type:
            case schema_1.make.uint32.type:
            case schema_1.make.int64.type:
            case schema_1.make.uint64.type:
                return `parseInt(${paramName})`;
        }
    }
    return paramName;
};
// returns a string representation of a function call used to
// convert parsed querystring param list to correct ts type
exports.fromQueryString = (paramName, type) => {
    if (schema_1.is.scalar(type)) {
        return exports.scalarFromQueryParam(paramName, type);
    }
    return schema_1.is.list(type) ? `${paramName}.map(val => ${exports.scalarFromQueryParam('val', type.dataType)})` : paramName;
};
// add question mark to optional type alias property or method param if needed
exports.handleOptional = (isOptional) => (isOptional ? '?' : '');
// builds a type alias from an rpc.Msg
exports.buildType = (msg) => {
    return `
export type ${plugin_utils_1.capitalize(msg.name)} = ${exports.typeLiteral(msg.properties)}
`;
};
// converts all rpc.Msg in a schema into type aliases
exports.buildTypes = (schema) => {
    let types = '';
    for (const type of schema.messages) {
        types = types.concat(exports.buildType(type));
    }
    return types;
};
// builds all of the parameters of a method
exports.buildParams = (params) => {
    let paramsString = '';
    for (let i = 0; i < params.length; i++) {
        const useComma = i === params.length - 1 ? '' : ',';
        paramsString = paramsString.concat(`${params[i].name}${exports.handleOptional(params[i].isOptional)}: ${exports.dataType(params[i].type)}${useComma}`);
    }
    return paramsString;
};
// builds a single method signature for an interface
exports.buildMethodSignature = (method) => {
    return `${plugin_utils_1.lowerCase(method.name)}(${exports.buildParams(method.params)}): Promise<${exports.dataType(method.returnType)}>;
`;
};
// builds an interface definition from a Schema Service
exports.buildInterface = (svc) => {
    let methodsString = '';
    for (const method of svc.methods) {
        methodsString = methodsString.concat(exports.buildMethodSignature(method));
    }
    return `
export interface ${plugin_utils_1.capitalize(svc.name)} {
  ${methodsString}
}\n`;
};
// builds interfaces for all QuerySvc and MutationSvc in a schemaFile
exports.buildInterfaces = (schema) => {
    let services = '';
    for (const svc of schema.queryServices) {
        services = services.concat(exports.buildInterface(svc));
    }
    for (const svc of schema.mutationServices) {
        services = services.concat(exports.buildInterface(svc));
    }
    return services;
};
// builds the param names list for a method E.G.
// name, age, gender
exports.paramNames = (params) => {
    if (params.length === 0) {
        return '';
    }
    let names = '';
    for (let i = 0; i < params.length; i++) {
        const useComma = i === params.length - 1 ? '' : ', ';
        names = names.concat(`${params[i].name}${useComma}`);
    }
    return names;
};
// used for building input params for methods and also to
// builds the type specifier for destructured parameters E.G.
// {name: string, age: number, gender: string}
exports.buildParamsWithTypes = (params) => {
    if (params.length === 0) {
        return '';
    }
    let paramsTypeString = '';
    for (let i = 0; i < params.length; i++) {
        const useComma = i === params.length - 1 ? '' : ', ';
        paramsTypeString = paramsTypeString.concat(`${params[i].name}${exports.handleOptional(params[i].isOptional)}: ${exports.dataType(params[i].type)}${useComma}`);
    }
    return paramsTypeString;
};
// makes a destructured parameters variable. E.G.
// const {name, age}: {name: string, age: number }
exports.buildParamsVar = (params) => `const {${exports.paramNames(params)}}: {${exports.buildParamsWithTypes(params)}}`;
// builds the import strings from a Schema's Imports list
exports.buildMsgImports = (imports) => {
    let importsStr = '';
    for (const imp of imports) {
        let msgs = '';
        let i = 0;
        while (i < imp.messageNames.length) {
            msgs = msgs.concat(`${imp.messageNames[i]} ${i === imp.messageNames.length - 1 ? '' : ','}`);
            i++;
        }
        importsStr = importsStr.concat(`import {${msgs}} from './${imp.fileName}'\n`);
    }
    return importsStr;
};
//# sourceMappingURL=index.js.map