import { Root, Content } from 'ts-mdast'
import { ReflectionKind } from 'typedoc'
import typedoc22 from './typedoc-0.22.json'
import { buildSymbolLinkIndex, generateLinkFromSymbol, SymbolIndex, SymbolPathItem } from '../helpers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const remarkTransform = require('..')

;[{ version: '0.22', typedoc: typedoc22 }].forEach(({ version, typedoc }) => {
  describe(`remark-typedoc-symbol-links: ${version}`, () => {
    test('should pass through with no options', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'a text node',
          },
        ],
      }

      const transform = remarkTransform()

      transform(mockMdast)

      expect(mockMdast).toEqual({
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'a text node',
          },
        ],
      })
    })

    test('should replace simple symbol text node with text and link nodes to symbol', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [',
          },
          {
            type: 'linkReference',
            label: 'Engine',
            identifier: 'Engine',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'Engine' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any, basePath: '' })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(3)

      const [lhs, link, rhs] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link.url).toBe('/classes/Engine.html')

      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('Engine')
    })

    test('remark 13 - should replace simple symbol text node with text and link nodes to symbol', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [[Engine]] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any, basePath: '' })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(3)

      const [lhs, link, rhs] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link.url).toBe('/classes/Engine.html')

      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('Engine')
    })

    test('remark 13 - should replace multiple symbol links with text and link nodes to symbol', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [[Engine]] docs and [[Engine.start]] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any, basePath: '' })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(5)

      const [lhs, link, rhs, link2, rhsLast] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs and ')
      expect(rhsLast.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link2.type).toBe('link')

      expect(link.url).toBe('/classes/Engine.html')
      expect(link2.url).toBe('/classes/Engine.html#start')

      expect((link.children as Content[])[0].value).toBe('Engine')
      expect((link2.children as Content[])[0].value).toBe('Engine.start')
    })

    test('should replace aliased symbol text node', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [',
          },
          {
            type: 'linkReference',
            label: 'Engine|the engine',
            identifier: 'engine|the engine',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'Engine|the engine' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(3)

      const [lhs, link, rhs] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link.url).toBe('/classes/Engine.html')

      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link tsdoc-link--aliased')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('the engine')
    })

    test('remark 13 - should replace aliased symbol text node', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [[Engine|the engine]] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(3)

      const [lhs, link, rhs] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link.url).toBe('/classes/Engine.html')

      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link tsdoc-link--aliased')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('the engine')
    })

    test('should annotate broken symbol with missing className', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [',
          },
          {
            type: 'linkReference',
            label: 'abcdefg',
            identifier: 'abcdefg',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'abcdefg' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(3)

      const [lhs, link, rhs] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link.url).toBe('')
      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link tsdoc-link--missing')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('abcdefg')
    })

    test('remark 13 - should annotate broken symbol with missing className', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [[abcdefg]] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(3)

      const [lhs, link, rhs] = mockMdast.children

      expect(lhs.value).toBe('A link to ')
      expect(rhs.value).toBe(' docs')

      expect(link.type).toBe('link')
      expect(link.url).toBe('')
      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link tsdoc-link--missing')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('abcdefg')
    })

    test('should warn on broken symbol in development env', () => {
      process.env.NODE_ENV = 'development'

      jest.spyOn(console, 'warn')

      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [',
          },
          {
            type: 'linkReference',
            label: 'abcdefg',
            identifier: 'abcdefg',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'abcdefg' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(console.warn).toHaveBeenCalledWith('remark-typedoc-symbol-links: Could not resolve symbol:', 'abcdefg')
    })

    test('remark 13 - should warn on broken symbol in development env', () => {
      process.env.NODE_ENV = 'development'

      jest.spyOn(console, 'warn')

      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [[abcdefg]]',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(console.warn).toHaveBeenCalledWith('remark-typedoc-symbol-links: Could not resolve symbol:', 'abcdefg')
    })

    test('should transform children', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'A link to [',
              },
              {
                type: 'linkReference',
                label: 'Engine|the engine',
                identifier: 'engine|the engine',
                referenceType: 'shortcut',
                children: [{ type: 'text', value: 'Engine|the engine' }],
              },
              {
                type: 'text',
                value: '] docs',
              },
            ],
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(1)
      expect(mockMdast.children[0].children).toHaveLength(3)
      expect((mockMdast.children[0].children as Content[])[1].type).toBe('link')
    })

    test('remark 13 - should transform children', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'A link to [[Engine|the engine]] docs',
              },
            ],
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      expect(mockMdast.children).toHaveLength(1)
      expect(mockMdast.children[0].children).toHaveLength(3)
      expect((mockMdast.children[0].children as Content[])[1].type).toBe('link')
    })

    test('should skip invalid link references', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [',
          },
          {
            type: 'linkReference',
            identifier: 'missing label',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'invalid' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      const [, link] = mockMdast.children

      expect(link.type).toBe('linkReference')
    })

    test('should skip unbalanced brackets', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to',
          },
          {
            type: 'linkReference',
            label: 'missing lhs',
            identifier: 'missing lhs',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'invalid' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      const [, link] = mockMdast.children

      expect(link.type).toBe('linkReference')
    })

    test('should skip when lhs is missing', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'text',
            value: 'A link to [',
          },
          {
            type: 'linkReference',
            label: 'missing lhs',
            identifier: 'missing lhs',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'invalid' }],
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      const [, link] = mockMdast.children

      expect(link.type).toBe('linkReference')
    })

    test('should skip when rhs is missing', () => {
      const mockMdast: Root = {
        type: 'root',
        children: [
          {
            type: 'linkReference',
            label: 'missing lhs',
            identifier: 'missing lhs',
            referenceType: 'shortcut',
            children: [{ type: 'text', value: 'invalid' }],
          },
          {
            type: 'text',
            value: '] docs',
          },
        ],
      }
      const transform = remarkTransform({ typedoc: typedoc as any })

      transform(mockMdast)

      const [link] = mockMdast.children

      expect(link.type).toBe('linkReference')
    })

    describe('generateLinkFromSymbol', () => {
      let lookup: SymbolIndex

      beforeAll(() => {
        lookup = buildSymbolLinkIndex(typedoc as any)
      })

      test('should generate link for class symbol', () => {
        expect(generateLinkFromSymbol('Engine', '/', lookup)).toBe('/classes/Engine.html')
      })

      test('should generate link for class constructor symbol', () => {
        expect(generateLinkFromSymbol('Engine#ctor', '/', lookup)).toBe('/classes/Engine.html#constructor')
      })

      test('should generate link for class method symbol', () => {
        expect(generateLinkFromSymbol('Engine.start', '/', lookup)).toBe('/classes/Engine.html#start')
      })

      test('should generate link for class static method symbol', () => {
        expect(generateLinkFromSymbol('Engine.createMainLoop', '/', lookup)).toBe('/classes/Engine.html#createMainLoop')
      })

      test('should generate link for class property symbol', () => {
        expect(generateLinkFromSymbol('Engine.rootScene', '/', lookup)).toBe('/classes/Engine.html#rootScene')
      })

      test('should generate link for class accessor symbol', () => {
        expect(generateLinkFromSymbol('Engine.canvasHeight', '/', lookup)).toBe('/classes/Engine.html#canvasHeight')
      })

      test('should generate link for interface symbol', () => {
        expect(generateLinkFromSymbol('EngineOptions', '/', lookup)).toBe('/interfaces/EngineOptions.html')
      })

      test('should generate link for interface property symbol', () => {
        expect(generateLinkFromSymbol('EngineOptions.backgroundColor', '/', lookup)).toBe(
          '/interfaces/EngineOptions.html#backgroundColor',
        )
      })

      test('should generate link for module function symbol', () => {
        expect(generateLinkFromSymbol('roundRect', '/', lookup)).toBe('/modules/Util.DrawUtil.html#roundRect')
      })

      test('should generate link for module enum symbol', () => {
        expect(generateLinkFromSymbol('DisplayMode', '/', lookup)).toBe('/enums/DisplayMode.html')
      })

      test('should generate link for module enum member symbol', () => {
        expect(generateLinkFromSymbol('DisplayMode.FillContainer', '/', lookup)).toBe(
          '/enums/DisplayMode.html#FillContainer',
        )
      })

      test('should generate link for type alias symbol', () => {
        expect(generateLinkFromSymbol('activate', '/', lookup)).toBe('/modules.html#activate')
      })

      test('should generate link for type alias symbol in namespace', () => {
        expect(generateLinkFromSymbol('Events.activate', '/', lookup)).toBe('/modules/Events.html#activate')
      })

      test('should generate link for variables symbol', () => {
        expect(generateLinkFromSymbol('CollisionJumpTable', '/', lookup)).toBe('/modules.html#CollisionJumpTable')
      })

      test('should generate link for module symbol', () => {
        expect(generateLinkFromSymbol('clamp', '/', lookup)).toBe('/modules/Util.html#clamp')
      })

      test('should generate link for some module symbol', () => {
        const someModuleIndex: SymbolIndex = new Map<string, SymbolPathItem[]>([
          [
            'test',
            [
              ['someModule', ReflectionKind.SomeModule],
              ['test', ReflectionKind.Function],
            ],
          ],
        ])
        expect(generateLinkFromSymbol('test', '/', someModuleIndex)).toBe('/modules/someModule.html#test')
      })

      test('should pass through if invalid container kind', () => {
        const invalidContainerIndex: SymbolIndex = new Map<string, SymbolPathItem[]>([
          ['test', [['test', ReflectionKind.Function]]],
        ])
        expect(generateLinkFromSymbol('test', '/', invalidContainerIndex)).toBe('/#test')
      })
    })

    describe('buildSymbolLinkIndex', () => {
      test('should skip if no node is passed', () => {
        const lookup = buildSymbolLinkIndex(undefined)

        expect(lookup.size).toBe(0)
      })

      test('should build index of fully-qualified symbol path expressions', () => {
        const lookup = buildSymbolLinkIndex(typedoc as any)

        // Classes, ctors, methods, accessors
        expect(lookup.has('Engine#ctor')).toBe(true)
        expect(lookup.has('Engine.start')).toBe(true)
        expect(lookup.has('Engine.halfCanvasHeight')).toBe(true)

        // Interfaces
        expect(lookup.has('EngineOptions')).toBe(true)

        // Exported module functions
        expect(lookup.has('clamp')).toBe(true)

        // Enums
        expect(lookup.has('DisplayMode')).toBe(true)
        expect(lookup.has('DisplayMode.FillContainer')).toBe(true)

        // Variables
        expect(lookup.has('CollisionJumpTable')).toBe(true)

        // Type aliases
        expect(lookup.has('activate')).toBe(true)

        // Namespaces
        expect(lookup.has('Events.activate')).toBe(true)
      })
    })
  })
})
