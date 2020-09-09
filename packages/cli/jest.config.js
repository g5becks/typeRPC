/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check
/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */
const { pathsToModuleNameMapper } = require('ts-jest/utils')

const { compilerOptions } = require('../../tsconfig.json')

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: './tests/.+\\.test\\.ts$',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/../',
    }),
}
