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
exports.dataTypeTestsSource = exports.typesTestData = exports.isValidDataTypeTestSource = exports.genTestFile = exports.hasCborParamsTestData = exports.genImports = exports.exportTestMessages = exports.useCbor = exports.optional = exports.makeStructTestSource = exports.genSourceFiles = exports.genSourceFile = exports.testQuerySvc = exports.genServices = exports.genRpcMessages = exports.genMsgNames = exports.genTestMessageFiles = void 0;
const data_gen_1 = require("./data-gen");
const message_gen_1 = require("./message-gen");
Object.defineProperty(exports, "genMsgNames", { enumerable: true, get: function () { return message_gen_1.genMsgNames; } });
Object.defineProperty(exports, "genRpcMessages", { enumerable: true, get: function () { return message_gen_1.genRpcMessages; } });
Object.defineProperty(exports, "genTestMessageFiles", { enumerable: true, get: function () { return message_gen_1.genTestMessageFiles; } });
const service_gen_1 = require("./service-gen");
Object.defineProperty(exports, "genServices", { enumerable: true, get: function () { return service_gen_1.genServices; } });
exports.testQuerySvc = `
type TestQuerySvc = rpc.QuerySvc<{
  /**
   * @throws 404
   * @returns 200
   */
  getSomethingById(id: number): string;

  /**
   * @throws 500
   * @returns 202
   */
  addSomething(something: any): any;

  /**
   * @throws 401
   * @returns 201
   */
  addSomethingElse(something: any): any;

  /**
   * @throws 400
   * @returns 204
   */
  deleteSomething(something: any): any;

  /**
   * @throws 403
   * @returns 301
   */
  preRequest(): boolean;

  /**
   * @access OPTIONS
   */
  getOpts(): string[];

  /**
   * @access PATCH
   */
  updateSomething(something: any): string;
}`;
exports.genSourceFile = (source, project, name = 'test.ts') => project.createSourceFile(name, source, { overwrite: true });
exports.genSourceFiles = (sources, project) => {
    for (const [name, source] of sources) {
        project.createSourceFile(name, source);
    }
    return project.getSourceFiles();
};
exports.makeStructTestSource = `
  /** @kind cbor */
type CborType = rpc.Msg<{}>

/** @kind cbor */
type AnotherCbor = rpc.Msg<{}>
type TestType1 = {
  prop1: CborType;
  prop2: AnotherCbor;
}

/**
*
*/
type NoCbor = rpc.Msg<{}>

type MoreNoCbor = rpc.Msg<{}>

type TestType2 = {
  prop1: NoCbor;
  prop2: MoreNoCbor;
}
`;
exports.optional = () => (data_gen_1.randomNumber(0, 4) === 1 ? '?' : '');
exports.useCbor = () => data_gen_1.randomNumber(0, 5) === 1
    ? `
  /**
 * @kind cbor
 */
 `
    : '';
exports.exportTestMessages = `
export type ExportedType = rpc.Msg<{
  name: $.str
}>

type NonExportedType = rpc.Msg<{
  name: $.str
}>
`;
exports.genImports = (msgNames) => {
    let imports = '';
    let i = 0;
    while (i < msgNames.length) {
        const useComma = i === msgNames.length - 1 ? '' : ', ';
        imports = imports.concat(msgNames[i] + useComma);
        i++;
    }
    return `import {${imports}} from './dummy-file'\n`;
};
exports.hasCborParamsTestData = `

/** @kind cbor */
type CborParam = rpc.Msg<{}>
type TestService1 = rpc.MutationSvc<{
  method1(param: CborParam, param2: $.str): $.list<$.int8>;
  method2(param: $.int8): CborParam;
}>

type TestService2 = rpc.MutationSvc<{
  /** @kind cbor */
  method1(param: $.str, param2: $.int8): $.unit;
  method2(param: $.str, param3: $.int16): $.nil;
}>

type TestService3 = rpc.MutationSvc<{
  method1(param: $.str): $.unit;
}>
`;
exports.genTestFile = () => {
    const names = message_gen_1.genMsgNames();
    const names2 = message_gen_1.genMsgNames();
    const messages = message_gen_1.genRpcMessages(names, names2);
    const queryServices = service_gen_1.genServices('Query', names);
    const mutationServices = service_gen_1.genServices('Mutation', names);
    const imports = exports.genImports(names2);
    return imports.concat(messages).concat(queryServices).concat(mutationServices);
};
exports.isValidDataTypeTestSource = `
  type Valid = rpc.Msg<{
      dummy: $.str
  }>
  type SomeSvc = rpc.Msg<{
      invalidType = string
      validType = $.str
      inValid = rpc.Ms<{
      name: $.str
      }>
      valid = $.int8
      invalid1 = $.int
      valid1 = $.uint8
      invalid2 = Who
      valid2 = Valid
  }>
`;
exports.typesTestData = `
import {SomeStruct} from './somewhere'
/** @kind cbor */
type CborType = rpc.Msg<{name: $.str}>

type TestType = rpc.Msg<{
  dict: $.map<$.int8, $.int8>
  tuple2: $.tuple2<$.int8, $.int8>
  tuple3: $.tuple3<$.int8, $.int16, $.uint16>
  tuple4: $.tuple4<$.int8, $.str, $.bool, $.timestamp>
  tuple5: $.tuple5<$.str, $.str, $.dyn, $.blob, $.float32>
  list: $.list<$.bool>
  struct: SomeStruct
  structLiteral: rpc.Msg<{
    name: $.str,
    age: $.int8,
    birthDate: $.timestamp,
    weight: $.float32
    }>
  cborType: CborType
  bool: $.bool
  int8: $.int8
  uint8: $.uint8
  int16: $.int16
  uint16: $.uint16
  int32: $.int32
  uint32: $.uint32
  int64: $.int64
  uint64: $.uint64
  float32: $.float32
  float64: $.float64
  str: $.str
  timestamp: $.timestamp
  blob: $.blob
  dyn: $.dyn
	unit: $.unit
  nil: $.nil
  nestedDict: $.map<$.int8, $.list<$.map<$.bool, $.list<$.str>>>>
  nestedList: $.list<$.tuple4<$.tuple2<$.int64, $.list<$.blob>>, $.str, $.bool, $.map<$.str, $.timestamp>>>
	nestedMsg: rpc.Msg<{
  	    name: $.str
		data: $.map<$.int8, $.list<$.map<$.bool, $.list<$.str>>>>
	}>
	nestedTuple: $.tuple3<$.list<$.tuple2<$.float32, $.float64>>, $.str, $.dyn>
}>
`;
exports.dataTypeTestsSource = `
type TestType = rpc.Msg<{
  dict: $.map<$.str, $.int8>
  tuple2: $.tuple2<$.int8, $.int8>
  tuple3: $.tuple3<$.int8, $.int16, $.uint16>
  tuple4: $.tuple4<$.int8, $.str, $.bool, $.timestamp>
  tuple5: $.tuple5<$.str, $.str, $.dyn, $.blob, $.float32>
  list: $.list<$.bool>
  structLiteral: rpc.Msg<{
    name: $.str,
    age: $.int8,
    birthDate: $.timestamp,
    weight: $.float32
    }>
  bool: $.bool
  int8: $.int8
  uint8: $.uint8
  int16: $.int16
  uint16: $.uint16
  int32: $.int32
  uint32: $.uint32
  int64: $.int64
  uint64: $.uint64
  float32: $.float32
  float64: $.float64
  str: $.str
  timestamp: $.timestamp
  blob: $.blob
  dyn: $.dyn
  nestedDict: $.map<$.str, $.list<$.map<$.str, $.list<$.str>>>>
  queryParamList: $.list<$.int8>
}>`;
//# sourceMappingURL=index.js.map