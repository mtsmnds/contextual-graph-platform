

Tiptap does not have a built-in “document title” concept. There’s no automatic “first line = title” behavior out of the box. The default ‎`Document` node just defines its content as ‎`block+` — meaning any sequence of block nodes (paragraphs, headings, etc.) with no special treatment for the first one.

To get a Notion-style “first line is the title” pattern, you have to build it yourself using a custom Document schema. The official approach (from the forced content structure example (https://tiptap.dev/docs/examples/advanced/forced-content-structure)) is:

1. Extend the Document node to enforce a heading-first structure:

```js
const CustomDocument = Document.extend({
  content: 'heading block+',  // first node MUST be a heading, then any blocks
})

```

This uses ProseMirror’s schema to force the first node to always be a heading — the user can’t delete it or replace it with a paragraph.

2. For collaborative docs, Tiptap suggests using Y.js fragments to split title and body into separate editors entirely (from the naming documents guide (https://tiptap.dev/docs/guides/naming-documents)):

```js
const titleEditor = new Editor({
  extensions: [
    Collaboration.configure({ document: ydoc, field: 'title' }),
  ],
})

const bodyEditor = new Editor({
  extensions: [
    Collaboration.configure({ document: ydoc, field: 'content' }),
  ],
})

```

3. Community solutions from the GitHub discussion include creating a custom ‎`Title` node that renders as ‎`<h1>` and constraining the document schema to ‎`title block+` — giving you more control (e.g., disabling marks/formatting on the title, preventing Enter from splitting it).

So in short: Tiptap gives you the tools to enforce “first line = heading title” via schema constraints on the Document node, but it’s opt-in — you have to configure it.