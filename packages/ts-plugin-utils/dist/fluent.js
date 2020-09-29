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
exports.buildResponseSchema = exports.buildRequestSchema = exports.buildMsgSchema = exports.responseSchemaName = exports.requestSchemaName = void 0;
const plugin_utils_1 = require("@typerpc/plugin-utils");
const schema_1 = require("@typerpc/schema");
const typeMap = new Map([
    [schema_1.make.bool.type, 'boolean()'],
    [schema_1.make.int8.type, 'number()'],
    [schema_1.make.uint8.type, 'number()'],
    [schema_1.make.int16.type, 'number()'],
    [schema_1.make.uint16.type, 'number()'],
    [schema_1.make.int32.type, 'number()'],
    [schema_1.make.uint32.type, 'number()'],
    [schema_1.make.int64.type, 'number()'],
    [schema_1.make.uint64.type, 'number()'],
    [schema_1.make.float32.type, 'number()'],
    [schema_1.make.float64.type, 'number()'],
    [schema_1.make.nil.type, 'null()'],
    [schema_1.make.str.type, 'string()'],
    [schema_1.make.dyn.type, 'object()'],
    // Math.round(Date.now() / 1000)
    [schema_1.make.timestamp.type, 'number()'],
    [schema_1.make.unit.type, 'object()'],
    [schema_1.make.blob.type, 'array().items(S.number())'],
]);
exports.requestSchemaName = (svcName, method) => `${plugin_utils_1.lowerCase(svcName)}${plugin_utils_1.capitalize(method.name)}RequestSchema`;
exports.responseSchemaName = (svcName, method) => `${plugin_utils_1.lowerCase(svcName)}${plugin_utils_1.capitalize(method.name)}ResponseSchema`;
const buildObjectSchema = (struct) => {
    let obj = 'object()';
    for (const prop of struct.properties) {
        obj = obj.concat(`.prop('${plugin_utils_1.lowerCase(prop.name)}', S.${schemaType(prop.type)}${prop.isOptional ? '' : '.required()'})`);
    }
    return obj;
};
const schemaType = (type) => {
    if (schema_1.is.dataType(type) !== true) {
        throw new TypeError(`${type} is not a valid typerpc Datatype`);
    }
    if (schema_1.is.scalar(type)) {
        const res = typeMap.get(type.type);
        if (!res) {
            throw new TypeError('invalid data type');
        }
        return res;
    }
    if (schema_1.is.map(type)) {
        return 'object()';
    }
    if (schema_1.is.list(type)) {
        return `array().items(S.${schemaType(type.dataType)})`;
    }
    if (schema_1.is.structLiteral(type)) {
        return buildObjectSchema(type);
    }
    if (schema_1.is.struct(type)) {
        return `${plugin_utils_1.lowerCase(type.name)}Schema`;
    }
    if (schema_1.is.tuple2(type)) {
        return `array().items([${schemaType(type.item1)}, ${schemaType(type.item2)}])`;
    }
    if (schema_1.is.tuple3(type)) {
        return `array().items([${schemaType(type.item1)}, ${schemaType(type.item2)}, ${schemaType(type.item3)}])`;
    }
    if (schema_1.is.tuple4(type)) {
        return `array().items([${schemaType(type.item1)}, ${schemaType(type.item2)}, ${schemaType(type.item3)}, ${schemaType(type.item4)}])`;
    }
    if (schema_1.is.tuple5(type)) {
        return `array().items([${schemaType(type.item1)}, ${schemaType(type.item2)}, ${schemaType(type.item4)}, ${schemaType(type.item5)}])`;
    }
    return '{}';
};
exports.buildMsgSchema = (msg, hash) => {
    let schema = `S.object().id('${msg.name}-${hash}').title('${msg.name} Schema').description('Schema for ${msg.name} rpc message')`;
    for (const prop of msg.properties) {
        schema = schema.concat(`.prop('${plugin_utils_1.lowerCase(prop.name)}', S.${schemaType(prop.type)})${prop.isOptional ? '' : '.required()'}`);
    }
    return `const ${plugin_utils_1.lowerCase(msg.name)}Schema = ${schema}
    `;
};
exports.buildRequestSchema = (svcName, method) => {
    let schema = `S.object().id('${svcName}.${method.name}Request').title('${svcName}.${method.name} Body').description('${svcName}.${method.name} Request Schema')`;
    for (const param of method.params) {
        schema = schema.concat(`.prop('${param.name}', S.${schemaType(param.type)})`);
    }
    return schema;
};
exports.buildResponseSchema = (svcName, method) => method.isVoidReturn
    ? '{}'
    : `S.object().id('${svcName}.${method.name}Response').title('${svcName}.${method.name} Response').description('${svcName}.${method.name} Response Schema').prop('data', S.${schemaType(method.returnType)})`;
//# sourceMappingURL=fluent.js.map