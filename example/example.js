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
