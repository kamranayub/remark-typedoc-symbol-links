import type { DeclarationReflection } from 'typedoc/dist/lib/models/reflections/declaration'

export interface Options {
  typedoc?: DeclarationReflection
  basePath?: string
  linkClassName?: string
  linkMissingClassName?: string
  linkAliasedClassName?: string
  linkTitleMessage?: (symbolPath: string, missing: boolean) => string
}
