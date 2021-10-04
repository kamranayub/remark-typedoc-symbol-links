# remark-typedoc-symbol-links

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/kamranayub/remark-typedoc-symbol-links.svg)
![GitHub repo size](https://img.shields.io/github/repo-size/kamranayub/remark-typedoc-symbol-links.svg)
![npm](https://img.shields.io/npm/dw/remark-typedoc-symbol-links.svg)
![npm](https://img.shields.io/npm/dm/remark-typedoc-symbol-links.svg)
![npm](https://img.shields.io/npm/dy/remark-typedoc-symbol-links.svg)
![npm](https://img.shields.io/npm/dt/remark-typedoc-symbol-links.svg)
![NPM](https://img.shields.io/npm/l/remark-typedoc-symbol-links.svg)
![npm](https://img.shields.io/npm/v/remark-typedoc-symbol-links.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/kamranayub/remark-typedoc-symbol-links.svg)
![npm collaborators](https://img.shields.io/npm/collaborators/remark-typedoc-symbol-links.svg)

A Remark plugin for transforming [TypeDoc](https://typedoc.org) symbol links, such as `[[symbol]]` to a Markdown link, with Rehype compatibility.

## Typedoc Compatibility

This version requires `>=0.21.3 && < 0.22.0`. Use earlier versions of the package for Typedoc versions below this range.

The `peerDependencies` is kept up-to-date with what version of TypeDoc is supported. Each minor version tends to contain some breaking changes that affect this parsing.

## Install

Install via `npm` or `yarn`:

```sh
# npm
npm install remark-typedoc-symbol-links

# yarn
yarn add remark-typedoc-symbol-links
```

## Usage

Then within Node.js:

```js
const typedocSymbolLinks = require('remark-typedoc-symbol-links')
```

### With Gatsby.js

This was developed for use by the [excalibur.js](https://excaliburjs.com) project and is used in the documentation site, see [the Gatsby config](https://github.com/excaliburjs/excaliburjs.github.io/blob/site/gatsby-config.js). This is the underlying package used in [gatsby-remark-typedoc-symbol-links](https://github.com/kamranayub/gatsby-remark-typedoc-symbol-links) which depends on the [gatsby-source-typedoc](https://github.com/kamranayub/gatsby-source-typedoc) package to generate the required TypeDoc project structure for a TypeScript project and makes it available via GraphQL nodes.

### With Remark and unified

This plugin is meant to be used with [mdast](https://github.com/syntax-tree/mdast) inside a [unified](https://unifiedjs.com/) pipeline. If using directly as a Remark plugin, see `examples/example.js`.

Given the folowing Markdown:

```md
## Introduction

Create a new [[Engine]] instance and call [[Engine.start|start]] to start the game!
```

And the following usage with `unified` and `remark-parse`:

```js
const fs = require('fs')
const unified = require('unified')
const markdown = require('remark-parse')
const html = require('remark-html')
const typedocSymbolLinks = require('../dist')

// Load generated TypeDoc
const typedoc = JSON.parse(fs.readFileSync('../src/__tests__/typedoc.json'))

const doc = unified()
  .use(markdown)
  // Pass typedoc and other options
  .use(typedocSymbolLinks, { typedoc, basePath: '/docs/api' })
  .use(html)
  .processSync(fs.readFileSync('example.md'))
  .toString()

console.log(doc)
```

Node will output:

```html
<h2>Introduction</h2>
<p>
  Create a new
  <a href="/docs/apiclasses/_engine_.engine.html" title="View &#x27;Engine&#x27;" class="tsdoc-link" target="_blank"
    >Engine</a
  >
  instance and call
  <a
    href="/docs/apiclasses/_engine_.engine.html#start"
    title="View &#x27;Engine.start&#x27;"
    class="tsdoc-link tsdoc-link--aliased"
    target="_blank"
    >start</a
  >
  to start the game!
</p>
```

### Handling missing links

When no matching symbol is detected, the anchor link is rendered with a missing class name (default: `tsdoc-link--missing`) and the title changes to indicate the symbol is missing. A warning is also output to the console in development mode (`NODE_ENV === 'development'`). This should provide enough feedback to make it easier to ensure your documentation doesn't drift out of date.

## API

### `remark().use(typedocSymbolLinks[, options])`

Transform TypeDoc markdown symbol links to links, with rehype compatibility.

#### `options`

##### `options.typedoc: object` (required)

An object representing TypeDoc output for a TypeScript project (such as running through `typedoc --generateJson` or done programmatically). This is the tree used to index symbols and perform link resolution. When used with [gatsby-source-typedoc](https://github.com/kamranayub/gatsby-source-typedoc), this is provided automatically. See `examples/example.js` for an example loading JSON using `fs.readSync`.

##### `options.basePath: string` (optional, default: `/`)

The path prefix to prepend to all generated links. Typically the path to where your generated TypeDoc documentation lives.

##### `options.linkClassName: string` (optional, default: `tsdoc-link`)

The default class name to apply to the generated link. Will always be present on the link.

##### `options.linkMissingClassName: string` (optional, default: `tsdoc-link--missing`)

This will be appended to the link class names if the symbol could not be resolved.

##### `options.linkAliasedClassName: string` (optional, default: `tsdoc-link--aliased`)

This will be appened to the link class names if the symbol had an alias (e.g. `[[Class.method|a cool method]]`)

#### `options.linkTitleMessage: (symbolPath: string, missing: boolean) => string` (optional)

A function to invoke that will be passed the qualified symbol path (e.g. `Class.method`) and whether or not the symbol was missing. If `missing` is `true`, the link could not be resolved.

The default implementation shows the following messages:

```
missing => `Could not resolve link to '${symbolPath}'`
not missing => `View '${symbolPath}'`
```

## Compatibility and differences from TypeDoc

This plugin attempts to emulate TypeDoc's [link resolution](http://typedoc.org/guides/link-resolution/) but it's important to point out that the plugin _has no context_ when resolving symbols (meaning, it's a Markdown page outside your source code, so it cannot look hierarchically to resolve links). That means that you may need to fully-qualify methods, properties, and functions if they are not unique.

### Classes, Interfaces, and Enums

`class`, `enum`, and `interface` symbols and their members only need to be qualified by the container name. Use `ClassName#ctor` for linking to the constructor of a class.

#### Examples:

- `[[Engine]]` - Class, interface, or enum name
- `[[Engine#ctor]]` - Class constructor
- `[[Engine.start]]` - Member name

### Module functions

If a function is exported within a module, it can be linked to by name. However, if there are similarly named functions _in different modules_, the first match will be used. This could be fixed through fully-qualified module naming, see [this note](#unsupported--module-index-links).

#### Examples:

- `[[clamp]]` - Exported function

### Unsupported: Module indexes

When generating documentation with modules enabled in TypeDoc, it generates names like `"ModuleName/SubmoduleName"`. Right now, the plugin is limited because it does not allow linking directly to a module index page, since it assumes you typically want to link to a symbol _within_ a module. That is how it can avoid forcing you to always fully-qualify a symbol path with the module name.

Example, this won't work:

```md
See [["ModuleName"]]
```

On the flip-side, you don't need to do this:

```md
See [["ModuleName".myFunction]]
```

Since module symbols are all indexed, you can leave off the module qualifiers:

```md
See [[myFunction]]
```

This is a limitation could be overcome but it needs some thought. For example, maybe to link to a module index, you could do:

```md
See [[module:Module/SubModule]]
```

This could ignore quotes and allow linking to the module index page. If you think you need this, I welcome PRs!

### Simple symbol links

The following Markdown:

    Check out the [[Sword.slash]] source code!

Will be transformed into this HTML:

    Check out the <a href="/classes/_module_.sword.html#slash" target="_blank" class="tsdoc-link" title="View 'Sword.slash'">Sword.slash</a> source code!

### Aliased symbol links

The following Markdown:

    Check out the [[Sword.slash|slash helper]] source code!

Will be transformed into this HTML:

    Check out the <a href="/classes/_module_.sword.html#slash" target="_blank" class="tsdoc-link tsdoc-link--aliased" title="View 'Sword.slash'">slash helper</a> source code!

### Missing symbol links

The following Markdown:

    Check out the [[abcdefg]] source code!

Will be transformed into this HTML:

    Check out the <a target="_blank" class="tsdoc-link tsdoc-link--missing" title="Could not resolve link for 'abcdefg'">abcdefg</a> source code!

## Contributing

See [Contributing](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md)

## License

MIT