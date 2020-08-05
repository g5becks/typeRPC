import {MethodSignature} from 'ts-morph'

export type HTTPVerb = 'POST' | 'PUT' | 'GET' | 'HEAD' | 'DELETE' | 'OPTIONS' | 'PATCH'
const isRequestMethod = (method: string): method is HTTPVerb => {
  return ['POST', 'PUT', 'GET', 'HEAD', 'DELETE', 'OPTIONS', 'PATCH'].includes(method)
}

export class Method {
  constructor(private readonly method: MethodSignature) {
  }

  public get httpVerb(): HTTPVerb  {
    const docs = this.method.getJsDocs()
    const rMethod = docs[0]?.getDescription().trim().toUpperCase()
    return rMethod && isRequestMethod(rMethod) ? rMethod as HTTPVerb : 'POST' as HTTPVerb
  }
}
