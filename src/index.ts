import modifyChildren from 'unist-util-modify-children'
import { Root, Node, isText, isParent, isLinkReference, createText, Text } from 'ts-mdast'
import { buildSymbolLinkIndex, generateLinkFromSymbol } from './helpers'
import { Options } from './types'

type MdastTransformer = (tree: Root) => void

const DEFAULT_OPTIONS = {
  basePath: '/',
  linkClassName: 'tsdoc-link',
  linkAliasedClassName: 'tsdoc-link--aliased',
  linkMissingClassName: 'tsdoc-link--missing',
  linkTitleMessage(symbolPath: string, missing: boolean) {
    return missing ? `Could not resolve link to '${symbolPath}'` : `View '${symbolPath}'`
  },
}

function isSymbolLinkTextNode(node: Node): node is Text {
  return isText(node) && node.value.indexOf('[[') > -1
}

export = function remarkTypedocSymbolLinks(userOptions: Options = {}): MdastTransformer {
  const options = { ...DEFAULT_OPTIONS, ...userOptions }
  const symbolLinkIndex = buildSymbolLinkIndex(options.typedoc)

  const remarkLegacyLinkModifier: modifyChildren.Modifier = (node, index, parent): number | void => {
    if (!isLinkReference(node)) return

    const nodeIndex = parent.children.indexOf(node)
    const prevNode = parent.children[nodeIndex - 1]
    const nextNode = parent.children[nodeIndex + 1]

    // A symbol link is interpreted as a linkReference and will
    // have a left and right text node with `[` and `]` as the last
    // and first character value, respectively.
    if (
      prevNode &&
      isText(prevNode) &&
      prevNode.value.endsWith('[') &&
      nextNode &&
      isText(nextNode) &&
      nextNode.value.startsWith(']')
    ) {
      const linkText = node.label

      if (!linkText) {
        return
      }

      // does it have an alias display value? e.g. [[Symbol.method|display text]]
      const [symbol, ...alias] = linkText.split('|')
      const displayValue = alias.length ? alias.join('') : linkText
      const symbolLink = generateLinkFromSymbol(symbol, options.basePath, symbolLinkIndex)
      const missing = !symbolLink

      if (process.env.NODE_ENV === 'development' && missing) {
        console.warn('remark-typedoc-symbol-links: Could not resolve symbol:', linkText)
      }

      const classNames = [options.linkClassName]

      if (missing) {
        classNames.push(options.linkMissingClassName)
      }

      if (displayValue !== linkText) {
        classNames.push(options.linkAliasedClassName)
      }

      // replace linkReference with link node
      const linkNode = {
        type: 'link',
        url: symbolLink || '',
        title: options.linkTitleMessage(symbol, missing),
        data: {
          hProperties: {
            className: classNames.join(' '),
            target: '_blank',
          },
        },
        children: [
          {
            type: 'text',
            value: displayValue,
          },
        ],
      }

      prevNode.value = prevNode.value.substring(0, prevNode.value.length - 1)
      parent.children.splice(index, 1, linkNode)
      nextNode.value = nextNode.value.substring(1)

      return index + 1
    }
  }

  const remarkMinimarkLinkModifier: modifyChildren.Modifier = (node, index, parent): number | void => {
    if (!isText(node)) return

    // A symbol link looks like [[symbol|optional label]]
    const bracketsRegex = /\[\[([^\]]+)\]\]/g
    const matches = node.value.matchAll(bracketsRegex)
    const newChildrenNodes = []

    for (const linkMatch of matches) {
      const linkText = linkMatch.groups?.[0]

      if (!linkText) {
        return
      }

      // does it have an alias display value? e.g. [[Symbol.method|display text]]
      const [symbol, ...alias] = linkText.split('|')
      const displayValue = alias.length ? alias.join('') : linkText
      const symbolLink = generateLinkFromSymbol(symbol, options.basePath, symbolLinkIndex)
      const missing = !symbolLink

      if (process.env.NODE_ENV === 'development' && missing) {
        console.warn('remark-typedoc-symbol-links: Could not resolve symbol:', linkText)
      }

      const classNames = [options.linkClassName]

      if (missing) {
        classNames.push(options.linkMissingClassName)
      }

      if (displayValue !== linkText) {
        classNames.push(options.linkAliasedClassName)
      }

      // inject text node with link node
      const linkNode = {
        type: 'link',
        url: symbolLink || '',
        title: options.linkTitleMessage(symbol, missing),
        data: {
          hProperties: {
            className: classNames.join(' '),
            target: '_blank',
          },
        },
        children: [
          {
            type: 'text',
            value: displayValue,
          },
        ],
      }

      const beforeTextNode = createText(node.value.substring(0, linkMatch.index))
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const afterTextNode = createText(node.value.substring(linkMatch.index! + linkMatch.length))
      newChildrenNodes.push(beforeTextNode, linkNode, afterTextNode)
    }

    parent.children.splice(index, 1, ...newChildrenNodes)
    return index + 1
  }

  const linkModifier: modifyChildren.Modifier = (node, index, number): number | void => {
    if (isParent(node) && node.children.length) {
      transformLinks(node)
    }

    if (isLinkReference(node)) {
      return remarkLegacyLinkModifier(node, index, number)
    } else if (isSymbolLinkTextNode(node)) {
      return remarkMinimarkLinkModifier(node, index, number)
    } else {
      return
    }
  }
  const transformLinks = modifyChildren(linkModifier)

  return transformer

  function transformer(tree: Node) {
    transformLinks(tree)
  }
}
