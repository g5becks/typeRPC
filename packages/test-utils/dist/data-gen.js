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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRandomDataType = exports.genRandomContainer = exports.genRandomName = exports.genRandomQueryParamableList = exports.genRandomQueryParamableScalar = exports.randomNumber = void 0;
const faker_1 = __importDefault(require("faker"));
function randomNumber(min, max) {
    // eslint-disable-next-line no-mixed-operators
    return Math.floor(Math.random() * (max - min) + min);
}
exports.randomNumber = randomNumber;
const queryParamables = [
    '$.bool',
    '$.timestamp',
    '$.int8',
    '$.uint8',
    '$.int16',
    '$.uint16',
    '$.int32',
    '$.uint32',
    '$.uint64',
    '$.int64',
    '$.float32',
    '$.float64',
    '$.str',
    '$.list',
];
// typerpc comparable (dict keys)
const comparables = [
    '$.bool',
    '$.int8',
    '$.uint8',
    '$.uint16',
    '$.int16',
    '$.int32',
    '$.uint32',
    '$.int64',
    '$.uint64',
    '$.float32',
    '$.float64',
    '$.str',
    '$.timestamp',
    '$.dyn',
];
// creates a random @typerpc rpc.Comparable
const genRandomComparable = () => comparables[randomNumber(0, comparables.length)];
// creates a random scalar type that can be used as an rpc.QuerySvc param
exports.genRandomQueryParamableScalar = () => queryParamables.filter((val) => val !== '$.list')[randomNumber(0, queryParamables.length - 1)];
exports.genRandomQueryParamableList = () => `$.list<${exports.genRandomQueryParamableScalar()}>`;
// a list of @typerpc/type => rpc.container strings with rpc.Comparables
// as key type
const containers = [
    `$.map<${genRandomComparable()}, ${genRandomComparable()}>`,
    `$.list<${genRandomComparable()}>`,
    `$.tuple2<${genRandomComparable()}, ${genRandomComparable()}>`,
    `$.tuple3<${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`,
    `$.tuple4<${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`,
    `$.tuple5<${genRandomComparable()},${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}, ${genRandomComparable()}>`,
];
// returns a random @typerpc rpc.container string that always has a scalar
const genRandomScalarContainer = () => containers[randomNumber(0, containers.length - 1)];
//
const paramables = [genRandomComparable, genRandomScalarContainer];
// returns a random rpc.Paramable dataType
// THIS FUNCTION AND EVERY FUNCTION THAT CALLS IS TAKES A msgNames PARAM
// BECAUSE THE SCHEMA VALIDATOR WILL THROW AN ERROR IF IT FINDS A TYPE THAT
// IS USED AND NOT DEFINED IN THE SAME FILE OR IMPORTED IN THE FILE, SO
// THE NAMES OF THE MESSAGES TO GENERATE NEED TO BE KNOWN BEFOREHAND
const genRandomParamableType = (msgNames) => {
    const funcs = [...paramables, () => msgNames[randomNumber(0, msgNames.length)]];
    return funcs[randomNumber(0, funcs.length)]();
};
const genDict = (msgNames) => `$.map<${genRandomComparable()}, ${genRandomParamableType(msgNames)}>`;
const genList = (msgNames) => `$.list<${genRandomParamableType(msgNames)}>`;
const genTuple2 = (msgNames) => `$.tuple2<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`;
const genTuple3 = (msgNames) => `$.tuple3<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`;
const genTuple4 = (msgNames) => `$.tuple4<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`;
const genTuple5 = (msgNames) => `$.tuple5<${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}, ${genRandomParamableType(msgNames)}>`;
// creates a random name for a Msg
exports.genRandomName = () => {
    let name = faker_1.default.name.firstName().toUpperCase() + randomNumber(0, 200);
    if (name.includes('`')) {
        name = name.replace('`', '');
    }
    if (name.includes("'")) {
        name = name.replace("'", '');
    }
    return name;
};
exports.genRandomContainer = (msgNames) => {
    const gen = [genDict, genList, genTuple2, genTuple3, genTuple4, genTuple5];
    return gen[randomNumber(0, gen.length)](msgNames);
};
exports.genRandomDataType = (msgNames) => {
    const generated = [exports.genRandomContainer(msgNames), ...comparables, '$.nil', '$.unit'];
    return generated[randomNumber(0, generated.length)];
};
//# sourceMappingURL=data-gen.js.map