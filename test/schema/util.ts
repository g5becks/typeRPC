export const validImport = 'import {t} from \'@typerpc/types\''
export const validInterface = `
  interface Test {
    getNames(name: t.str): t.bool
  }
  `
export const sourceWithValidImportAndInterface = (source: string) => `
${validImport}
${source}
${validInterface}
`
