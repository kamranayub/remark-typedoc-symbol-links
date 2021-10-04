import { Root, Content } from 'ts-mdast'
import { ReflectionKind } from 'typedoc'
import typedoc20 from './typedoc-0.20.json'
import typedoc17 from './typedoc-0.17.json'
import { buildSymbolLinkIndex, generateLinkFromSymbol, SymbolIndex, SymbolPathItem } from '../helpers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const remarkTransform = require('..')

;[
  { version: '0.20', typedoc: typedoc20 },
  { version: '0.17', typedoc: typedoc17 },
].forEach(({ version, typedoc }) => {
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
      if (version === '0.17') {
        expect(link.url).toBe('/classes/_engine_.engine.html')
      } else {
        expect(link.url).toBe('/classes/engine.engine.html')
      }
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
      if (version === '0.17') {
        expect(link.url).toBe('/classes/_engine_.engine.html')
      } else {
        expect(link.url).toBe('/classes/engine.engine.html')
      }

      expect((link.data?.hProperties as any)?.className).toBe('tsdoc-link')
      expect(link.children).toHaveLength(1)
      const [linkText] = link.children as Content[]
      expect(linkText.type).toBe('text')
      expect(linkText.value).toBe('Engine')
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
      if (version === '0.17') {
        expect(link.url).toBe('/classes/_engine_.engine.html')
      } else {
        expect(link.url).toBe('/classes/engine.engine.html')
      }
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
      if (version === '0.17') {
        expect(link.url).toBe('/classes/_engine_.engine.html')
      } else {
        expect(link.url).toBe('/classes/engine.engine.html')
      }

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
        if (version === '0.17') {
          expect(generateLinkFromSymbol('Engine', '/', lookup)).toBe('/classes/_engine_.engine.html')
        } else {
          expect(generateLinkFromSymbol('Engine', '/', lookup)).toBe('/classes/engine.engine.html')
        }
      })

      test('should generate link for class constructor symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('Engine#ctor', '/', lookup)).toBe('/classes/_engine_.engine.html#constructor')
        } else {
          expect(generateLinkFromSymbol('Engine#ctor', '/', lookup)).toBe('/classes/engine.engine.html#constructor')
        }
      })

      test('should generate link for class method symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('Engine.start', '/', lookup)).toBe('/classes/_engine_.engine.html#start')
        } else {
          expect(generateLinkFromSymbol('Engine.start', '/', lookup)).toBe('/classes/engine.engine.html#start')
        }
      })

      test('should generate link for class static method symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('Engine.createMainLoop', '/', lookup)).toBe(
            '/classes/_engine_.engine.html#createmainloop',
          )
        } else {
          expect(generateLinkFromSymbol('Engine.createMainLoop', '/', lookup)).toBe(
            '/classes/engine.engine.html#createmainloop',
          )
        }
      })

      test('should generate link for class property symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('Engine.rootScene', '/', lookup)).toBe(
            '/classes/_engine_.engine.html#rootscene',
          )
        } else {
          expect(generateLinkFromSymbol('Engine.rootScene', '/', lookup)).toBe('/classes/engine.engine.html#rootscene')
        }
      })

      test('should generate link for class accessor symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('Engine.canvasHeight', '/', lookup)).toBe(
            '/classes/_engine_.engine.html#canvasheight',
          )
        } else {
          expect(generateLinkFromSymbol('Engine.canvasHeight', '/', lookup)).toBe(
            '/classes/engine.engine.html#canvasheight',
          )
        }
      })

      test('should generate link for interface symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('EngineOptions', '/', lookup)).toBe('/interfaces/_engine_.engineoptions.html')
        } else {
          expect(generateLinkFromSymbol('EngineOptions', '/', lookup)).toBe('/interfaces/engine.engineoptions.html')
        }
      })

      test('should generate link for interface property symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('EngineOptions.backgroundColor', '/', lookup)).toBe(
            '/interfaces/_engine_.engineoptions.html#backgroundcolor',
          )
        } else {
          expect(generateLinkFromSymbol('EngineOptions.backgroundColor', '/', lookup)).toBe(
            '/interfaces/engine.engineoptions.html#backgroundcolor',
          )
        }
      })

      test('should generate link for module function symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('clamp', '/', lookup)).toBe('/modules/_util_util_.html#clamp')
        } else {
          expect(generateLinkFromSymbol('clamp', '/', lookup)).toBe('/modules/util_index.html#clamp')
        }
      })

      test('should generate link for module enum symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('DisplayMode', '/', lookup)).toBe('/enums/_engine_.displaymode.html')
        } else {
          expect(generateLinkFromSymbol('DisplayMode', '/', lookup)).toBe('/enums/screen.displaymode.html')
        }
      })

      test('should generate link for module enum member symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('DisplayMode.Container', '/', lookup)).toBe(
            '/enums/_engine_.displaymode.html#container',
          )
        } else {
          expect(generateLinkFromSymbol('DisplayMode.Container', '/', lookup)).toBe(
            '/enums/screen.displaymode.html#container',
          )
        }
      })

      test('should generate link for type alias symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('activate', '/', lookup)).toBe('/modules/_events_.html#activate')
        } else {
          expect(generateLinkFromSymbol('activate', '/', lookup)).toBe('/modules/events.html#activate')
        }
      })

      test('should generate link for object literals symbol', () => {
        if (version === '0.17') {
          expect(generateLinkFromSymbol('REPORTED_FEATURES', '/', lookup)).toBe(
            '/modules/_util_detector_.html#reported_features',
          )
        } else {
          expect(generateLinkFromSymbol('REPORTED_FEATURES', '/', lookup)).toBe(
            '/modules/util_detector.html#reported_features',
          )
        }
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
        expect(generateLinkFromSymbol('test', '/', someModuleIndex)).toBe('/modules/somemodule.html#test')
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

        // Exported functions
        expect(lookup.has('clamp')).toBe(true)
        expect(lookup.has('canPlayFile')).toBe(true)

        // Enums
        expect(lookup.has('DisplayMode')).toBe(true)
        expect(lookup.has('DisplayMode.Container')).toBe(true)

        // Object literals / const
        expect(lookup.has('REPORTED_FEATURES')).toBe(true)

        // Type aliases
        expect(lookup.has('activate')).toBe(true)
      })
    })
  })
})
