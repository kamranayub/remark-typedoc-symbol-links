import { ReflectionKind } from 'typedoc'
import { DeclarationReflection } from 'typedoc/dist/lib/serialization/schema'
import { SYMBOL_LINK_KINDS, SYMBOL_CONTAINERS } from './constants'

export type SymbolPathItem = readonly [string, ReflectionKind]
export type SymbolIndex = Map<string, SymbolPathItem[]>

/**
 * Builds a lookup of symbol expressions to links for fast lookups
 * @param {AST} typedoc
 */
export function buildSymbolLinkIndex(
  node: DeclarationReflection | undefined,
  parents: DeclarationReflection[] = [],
  lookup: SymbolIndex = new Map(),
): SymbolIndex {
  if (!node) {
    return lookup
  }

  if (node.children && node.children.length) {
    node.children.forEach((symbol) => {
      if (!SYMBOL_LINK_KINDS.includes(symbol.kind) && !SYMBOL_CONTAINERS.includes(symbol.kind)) {
        return
      }
      buildSymbolLinkIndex(symbol, [...parents, node], lookup)
    })
  }
  const symbolExpression = [...parents, node].reduce((expr, n) => {
    if (!SYMBOL_LINK_KINDS.includes(n.kind)) {
      return expr
    }

    const separator = expr.length > 0 ? '.' : ''

    switch (n.kind) {
      case ReflectionKind.Constructor:
        return expr + '#ctor'
      case ReflectionKind.Function:
        return n.name
      default:
        return expr + separator + n.name
    }
  }, '')

  const symbolPath = [...parents, node].map((n) => [n.name, n.kind] as const)

  if (symbolExpression.length && !lookup.has(symbolExpression)) {
    lookup.set(symbolExpression, symbolPath)
  }

  return lookup
}

export function generateLinkFromSymbol(
  symbolPath: string,
  basePath: string,
  symbolLinkIndex: SymbolIndex,
): string | undefined {
  let symbolLink = undefined
  const symbolMatches: SymbolPathItem[] = symbolLinkIndex.get(symbolPath) ?? []
  basePath = ensureTrailingSlash(basePath)

  if (symbolMatches && symbolMatches.length) {
    const lastContainer = symbolMatches
      .concat([])
      .reverse()
      .find(([, kind]) => SYMBOL_CONTAINERS.includes(kind)) || [undefined, undefined]
    const [, containerKind] = lastContainer
    const lastContainerIndex = containerKind ? symbolMatches.indexOf(lastContainer) : undefined

    let containerPath

    switch (containerKind) {
      case ReflectionKind.Class:
        containerPath = 'classes/'
        break
      case ReflectionKind.Interface:
        containerPath = 'interfaces/'
        break
      case ReflectionKind.SomeModule:
      case ReflectionKind.Module:
      case ReflectionKind.Namespace:
        containerPath = 'modules/'
        break
      case ReflectionKind.Enum:
        containerPath = 'enums/'
        break
      default:
        containerPath = ''
    }

    const isTopLevelExport =
      containerPath === '' && symbolMatches.length === 2 && containerKind === ReflectionKind.Project

    if (isTopLevelExport) {
      containerPath = 'modules.html'
    }

    // assemble file url
    symbolLink = symbolMatches.reduce((path, [matchSymbolName, matchSymbolKind], matchSymbolIndex) => {
      switch (matchSymbolKind) {
        case ReflectionKind.Project:
          break
        case ReflectionKind.SomeModule:
        case ReflectionKind.Module:
        case ReflectionKind.Namespace:
          path += matchSymbolName.replace(/[^a-z0-9]/gi, '_') + '.'
          break
        case ReflectionKind.Class:
        case ReflectionKind.Interface:
        case ReflectionKind.Enum:
          path += matchSymbolName
          break
        default:
          path += '#' + matchSymbolName
          break
      }

      if (containerKind !== ReflectionKind.Project && matchSymbolIndex === lastContainerIndex) {
        path += (path.endsWith('.') ? '' : '.') + 'html'
      }

      return path
    }, basePath + containerPath)
  }

  return symbolLink
}

function ensureTrailingSlash(path: string) {
  if (!path.endsWith('/')) {
    return path + '/'
  }
  return path
}
