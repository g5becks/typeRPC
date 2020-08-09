import {MethodSignature, SourceFile,} from 'ts-morph'

export const getMethodsForFile = (file: SourceFile): MethodSignature[] => file.getInterfaces().flatMap(interfc => interfc.getMethods())

