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
exports.buildMsgImports = exports.paramNames = exports.buildInterfaces = exports.buildAbstractClass = exports.buildTypes = exports.responseClassName = exports.requestClassName = exports.buildMsgClass = exports.handleOptional = exports.fromQueryString = exports.scalarFromQueryParam = exports.dataType = exports.typeMap = void 0;
const plugin_utils_1 = require("@typerpc/plugin-utils");
const schema_1 = require("@typerpc/schema");
exports.typeMap = new Map([
    [schema_1.make.bool.type, 'bool'],
    [schema_1.make.int8.type, 'int'],
    [schema_1.make.uint8.type, 'int'],
    [schema_1.make.int16.type, 'int'],
    [schema_1.make.uint16.type, 'int'],
    [schema_1.make.int32.type, 'int'],
    [schema_1.make.uint32.type, 'int'],
    [schema_1.make.int64.type, 'int'],
    [schema_1.make.uint64.type, 'int'],
    [schema_1.make.float32.type, 'double'],
    [schema_1.make.float64.type, 'double'],
    [schema_1.make.nil.type, 'null'],
    [schema_1.make.str.type, 'String'],
    [schema_1.make.dyn.type, 'dynamic'],
    [schema_1.make.timestamp.type, 'DateTime'],
    [schema_1.make.unit.type, 'void'],
    [schema_1.make.blob.type, 'Uint8List'],
]);
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
        return `Map<${exports.dataType(type.keyType)}, ${exports.dataType(type.valType)}>`;
    }
    if (schema_1.is.list(type)) {
        return `List<${exports.dataType(type.dataType)}>`;
    }
    if (schema_1.is.struct(type)) {
        return type.name;
    }
    if (schema_1.is.tuple2(type)) {
        return `Tuple2<${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}>`;
    }
    if (schema_1.is.tuple3(type)) {
        return `Tuple3<${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}>`;
    }
    if (schema_1.is.tuple4(type)) {
        return `Tuple4<${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}, ${exports.dataType(type.item4)}>`;
    }
    if (schema_1.is.tuple5(type)) {
        return `Tuple5<${exports.dataType(type.item1)}, ${exports.dataType(type.item2)}, ${exports.dataType(type.item3)}, ${exports.dataType(type.item4)}, ${exports.dataType(type.item5)}>`;
    }
    return 'dynamic';
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
exports.handleOptional = (isOptional) => (isOptional ? '' : '@required');
const propClassName = (msgName, propName) => {
    return plugin_utils_1.capitalize(msgName) + plugin_utils_1.capitalize(propName) + 'Prop';
};
// Builds a class for any properties which are literal objects, which dart doesn't support.
const buildMsgProps = (msg) => {
    let properties = '';
    for (const property of msg.properties) {
        // if the property is an anonymous msg, return the name of the built class
        properties = properties.concat(`${exports.handleOptional(property.isOptional)} ${schema_1.is.structLiteral(property.type) ? propClassName(msg.name, property.name) : exports.dataType(property.type)} ${plugin_utils_1.lowerCase(property.name)},`);
    }
    return properties;
};
exports.buildMsgClass = (msg) => {
    return `
@freezed
class ${plugin_utils_1.capitalize(msg.name)} with _$${plugin_utils_1.capitalize(msg.name)} {
   @JsonSerializable(explicitToJson: true)
   factory ${plugin_utils_1.capitalize(msg.name)}({
      ${buildMsgProps(msg)}
   }) = _${plugin_utils_1.capitalize(msg.name)};

   factory ${plugin_utils_1.capitalize(msg.name)}.fromJson(Map<String, dynamic> json) =>
   _${plugin_utils_1.capitalize(msg.name)}FromJson(json);
}
`;
};
const paramClassName = (svcName, methodName, paramName) => '_' + plugin_utils_1.capitalize(svcName) + plugin_utils_1.capitalize(methodName) + plugin_utils_1.capitalize(paramName) + 'Param';
// Builds classes for any parameter that is a literal object, which dart does
// not support :( .
const buildClassesForParams = (svc) => {
    let types = '';
    for (const method of svc.methods) {
        for (const param of method.params) {
            if (schema_1.is.structLiteral(param.type)) {
                types = types.concat(exports.buildMsgClass({
                    name: paramClassName(svc.name, method.name, param.name),
                    properties: param.type.properties,
                }));
            }
        }
    }
    return types;
};
// The name of the class that will be built to serialize/deserialize the request
exports.requestClassName = (svcName, methodName) => '_' + plugin_utils_1.capitalize(svcName) + plugin_utils_1.capitalize(methodName) + 'Request';
// The name of the class that will be  build to serialize/deserialize the response
exports.responseClassName = (svcName, methodName) => '_' + plugin_utils_1.capitalize(svcName) + plugin_utils_1.capitalize(methodName) + 'Response';
// Builds request classes for every method in a schema file
const buildRequestClasses = (schema) => {
    let classes = '';
    for (const svc of schema.queryServices) {
        for (const method of svc.methods) {
            if (method.hasParams) {
                classes = classes.concat(exports.buildMsgClass({ name: exports.requestClassName(svc.name, method.name), properties: method.params }));
            }
        }
    }
    for (const svc of schema.mutationServices) {
        for (const method of svc.methods) {
            if (method.hasParams) {
                classes = classes.concat(exports.buildMsgClass({ name: exports.requestClassName(svc.name, method.name), properties: method.params }));
            }
        }
    }
    return classes;
};
const returnTypeLiteralName = (svcName, methodName) => plugin_utils_1.capitalize(svcName) + plugin_utils_1.capitalize(methodName) + 'Result';
// Builds a class for any methods in a file that returns an object literal,
// which dart does not support yet.
const buildReturnTypeLiterals = (schema) => {
    let classes = '';
    for (const svc of schema.queryServices) {
        for (const method of svc.methods) {
            if (!method.isVoidReturn && schema_1.is.structLiteral(method.returnType)) {
                classes = classes.concat(exports.buildMsgClass({
                    name: returnTypeLiteralName(svc.name, method.name),
                    properties: method.returnType.properties,
                }));
            }
        }
    }
    for (const svc of schema.mutationServices) {
        for (const method of svc.methods) {
            if (!method.isVoidReturn && schema_1.is.structLiteral(method.returnType)) {
                classes = classes.concat(exports.buildMsgClass({
                    name: returnTypeLiteralName(svc.name, method.name),
                    properties: method.returnType.properties,
                }));
            }
        }
    }
    return classes;
};
const buildResponseClass = (svcName, method) => {
    if (method.isVoidReturn) {
        return '';
    }
    const className = exports.responseClassName(svcName, method.name);
    return `
@freezed
class ${className} with _$${className} {
   @JsonSerializable(explicitToJson: true)
   factory ${plugin_utils_1.capitalize(className)}({
     @required ${schema_1.is.structLiteral(method.returnType) ? returnTypeLiteralName(svcName, method.name) : exports.dataType(method.returnType)} data,
   }) = _${plugin_utils_1.capitalize(className)};

   factory ${plugin_utils_1.capitalize(className)}.fromJson(Map<String, dynamic> json) =>
   _${plugin_utils_1.capitalize(className)}FromJson(json);

  }
`;
};
const buildResponseClasses = (schema) => {
    let classes = '';
    for (const svc of schema.queryServices) {
        for (const method of svc.methods) {
            classes = classes.concat(buildResponseClass(svc.name, method));
        }
    }
    for (const svc of schema.mutationServices) {
        for (const method of svc.methods) {
            classes = classes.concat(buildResponseClass(svc.name, method));
        }
    }
    return classes;
};
// converts all rpc.Msg in a schema into type aliases
exports.buildTypes = (schema) => {
    let types = '';
    for (const type of schema.messages) {
        types = types.concat(exports.buildMsgClass(type));
        // dart does not anonymous structs or classes, so we must check for
        // struct literal properties build them before hand.
        for (const prop of type.properties) {
            if (schema_1.is.structLiteral(prop.type)) {
                types = types.concat(exports.buildMsgClass({ name: propClassName(type.name, prop.name), properties: prop.type.properties }));
            }
        }
    }
    schema.queryServices.forEach((svc) => {
        types = types.concat(buildClassesForParams(svc));
    });
    schema.mutationServices.forEach((svc) => {
        types = types.concat(buildClassesForParams(svc));
    });
    types = types.concat(buildRequestClasses(schema));
    types = types.concat(buildReturnTypeLiterals(schema));
    types = types.concat(buildResponseClasses(schema));
    return types;
};
// builds an interface definition location a Schema Service
exports.buildAbstractClass = (svc) => {
    const buildParams = (method) => {
        let paramsString = '';
        for (let i = 0; i < method.params.length; i++) {
            paramsString = paramsString.concat(`${exports.handleOptional(method.params[i].isOptional)} ${schema_1.is.structLiteral(method.params[i].type)
                ? paramClassName(svc.name, method.name, method.params[i].name)
                : exports.dataType(method.params[i].type)} ${plugin_utils_1.lowerCase(method.params[i].name)},`);
        }
        return paramsString;
    };
    const buildMethodSignature = (method) => {
        const built = `({${buildParams(method)}})`;
        const returnType = schema_1.is.structLiteral(method.returnType)
            ? returnTypeLiteralName(svc.name, method.name)
            : `Future<${exports.dataType(method.returnType)}>`;
        return `${returnType} ${plugin_utils_1.lowerCase(method.name)}${!method.hasParams ? '()' : built};
`;
    };
    let methodsString = '';
    for (const method of svc.methods) {
        methodsString = methodsString.concat(buildMethodSignature(method));
    }
    return `
abstract class ${plugin_utils_1.capitalize(svc.name)} {
  ${methodsString}
}\n`;
};
// builds interfaces for all QuerySvc and MutationSvc in a schemaFile
exports.buildInterfaces = (schema) => {
    let services = '';
    for (const svc of schema.queryServices) {
        services = services.concat(exports.buildAbstractClass(svc));
    }
    for (const svc of schema.mutationServices) {
        services = services.concat(exports.buildAbstractClass(svc));
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
        names = names.concat(`${params[i].name},`);
    }
    return names;
};
// builds the import strings location a Schema's Imports list
exports.buildMsgImports = (imports) => {
    let importsStr = '';
    for (const imp of imports) {
        let msgs = '';
        let i = 0;
        while (i < imp.messageNames.length) {
            msgs = msgs.concat(`${imp.messageNames[i]} ${i === imp.messageNames.length - 1 ? '' : ','}`);
            i++;
        }
        importsStr = importsStr.concat(`} from './${imp.fileName}'\n`);
    }
    return importsStr;
};
//# sourceMappingURL=index.js.map