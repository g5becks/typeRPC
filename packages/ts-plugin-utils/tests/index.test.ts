import { dataType, fromQueryString } from '../src'
import { Project, PropertySignature } from 'ts-morph'
import { _testing as _schemaTesting } from '@typerpc/schema'
import { dataTypeTestsSource, genSourceFile } from '@typerpc/test-utils'

const { parseMsgProps, makeDataType } = _schemaTesting
const expected = [
    '{[key: string]: number}',
    '[number, number]',
    '[number, number, number]',
    '[number, string, boolean, number]',
    '[string, string, any, Uint8Array, number]',
    'Array<boolean>',
    '{name: string; age: number; birthDate: number; weight: number; }',
    'boolean',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'string',
    'number',
    'Uint8Array',
    'any',
    '{[key: string]: Array<{[key: string]: Array<string>}>}',
    'Array<[[number, Array<Uint8Array>], boolean, string, any]>',
    'Array<number>',
]

let project: Project
let props: PropertySignature[]
beforeAll(() => {
    project = new Project()
    props = parseMsgProps(genSourceFile(dataTypeTestsSource, project).getTypeAliasOrThrow('TestType'))
})

test('tsDataType() should produce the correct output', () => {
    const types = props.map((prop) => makeDataType(prop.getTypeNodeOrThrow()))
    let i = 0
    while (i < types.length) {
        expect(dataType(types[i])).toEqual(expected[i])
        i++
    }
})

test('tsFromQueryString() should produce the correct output', () => {
    const propsMap: { [key: string]: string } = {
        bool: 'Boolean(bool)',
        int8: 'parseInt(int8)',
        uint8: 'parseInt(uint8)',
        int16: 'parseInt(int16)',
        uint16: 'parseInt(uint16)',
        int32: 'parseInt(int32)',
        uint32: 'parseInt(uint32)',
        int64: 'parseInt(int64)',
        uint64: 'parseInt(uint64)',
        float32: 'parseFloat(float32)',
        float64: 'parseFloat(float64)',
        list: 'list.map(val => Boolean(val))',
        queryParamList: 'queryParamList.map(val => parseInt(val))',
    }

    const filteredProps = props.filter((prop) => Object.keys(propsMap).includes(prop.getName()))
    const types = filteredProps.map((prop) => makeDataType(prop.getTypeNodeOrThrow()))
    let i = 0
    while (i < types.length) {
        const name = filteredProps[i].getName()
        expect(fromQueryString(name, types[i])).toEqual(propsMap[name])
        i++
    }
})
