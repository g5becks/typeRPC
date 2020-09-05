import {Schema} from '../schema'
import {AxiosBuilder, dataType as tsDataType, fromQueryString as tsFromQueryString, KoaBuilder} from './typescript'
import {FiberBuilder} from './go'

export type Code = {
  readonly fileName: string;
  readonly source: string;
}

export type ProgrammingLanguage = 'go' | 'dart' | 'ts' | 'js' | 'ruby' | 'python' | 'C#' | 'F#' | 'vb' | 'kotlin' | 'java' | 'scala' | 'groovy' | 'rust' | 'C' | 'C++' | 'reason' | 'ocaml' | 'haskell' | 'php' | 'clojure' | 'elixir' | 'purescript' | 'ada' | 'D' | 'nim' | 'smalltalk' | 'julia' | 'R' | 'lua' | 'tcl' | 'prolog' | 'erlang' | 'object-pascal' | 'delphi' | 'self' | 'ceylon' | 'coffeescript' | 'swift' | 'elm' | 'eiffel' | 'hack' | 'haxe' | 'idris' | 'jython' | 'jruby' | 'objective-c' | 'pascal' | 'moonscript'

export type Target = 'client' | 'server'

export const languages = ['go', 'dart', 'ts', 'js', 'ruby', 'python', 'C#', 'F#', 'vb', 'kotlin', 'java', 'scala', 'groovy', 'rust', 'C', 'C++', 'reason', 'ocaml', 'haskell', 'php', 'clojure', 'elixir', 'purescript', 'ada', 'D', 'nim', 'smalltalk', 'julia', 'R', 'lua', 'tcl', 'prolog', 'erlang', 'object-pascal', 'delphi', 'self', 'ceylon', 'coffeescript', 'swift', 'elm', 'eiffel', 'hack', 'haxe', 'idris', 'jython', 'jruby', 'objective-c', 'pascal', 'moonscript']

export const isValidLang = (lang: string): lang is ProgrammingLanguage => languages.includes(lang)

export type CodeBuilderPlugin = {
  readonly lang: ProgrammingLanguage;
  readonly target: Target;
  readonly framework: string;
  readonly build: (schemas: Schema[]) => Code[];
  readonly format?: (path: string) => void;
}

export const builders: CodeBuilderPlugin[] = [
  KoaBuilder,
  AxiosBuilder,
  FiberBuilder,
]

export const _testing = {
  tsDataType,
  tsFromQueryString,
}
