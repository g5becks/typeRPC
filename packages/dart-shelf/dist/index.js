"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dart_plugin_utils_1 = require("@typerpc/dart-plugin-utils");
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
const imports = (schema) => `
import 'dart:async';
import 'dart:convert';

import 'dart:io';

import 'package:meta/meta.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:args/args.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as io;

part '${fileName(schema.fileName).replace('.dart', '')}.freezed.dart';
part '${fileName(schema.fileName).replace('.dart', '')}.g.dart';
`;
const fileName = (name) => (name.includes('-') ? name.split('-').join('_') + '.dart' : name + '.dart');
const buildFile = (schema) => {
    const source = `
    ${imports(schema)}
    ${dart_plugin_utils_1.buildTypes(schema)}
    ${dart_plugin_utils_1.buildInterfaces(schema)}

  `;
    return { fileName: fileName(schema.fileName), source };
};
// builds all schemas and server file
const build = (schemas) => [...schemas.map((schema) => buildFile(schema))];
exports.default = build;
//# sourceMappingURL=index.js.map