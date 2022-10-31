import fs from 'fs'
import unified from 'unified'
import markdown from 'remark-parse'
import html from 'remark-html'
import typedocSymbolLinks from '../dist/index.js'

// Load generated TypeDoc
const typedoc = JSON.parse(fs.readFileSync('../src/__tests__/typedoc-0.23.json'))

const doc = unified()
  .use(markdown)
  // Pass typedoc and other options
  .use(typedocSymbolLinks, { typedoc, basePath: '/docs/api' })
  .use(html, { sanitize: false })
  .processSync(fs.readFileSync('example.md'))
  .toString()

console.log(doc)

if (!doc.includes('class="tsdoc-link"')) {
  throw new Error('Unexpected output of markdown')
}
