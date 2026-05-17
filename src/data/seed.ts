import type { GraphSnapshot } from "../types/graph";

const SEED_TS = 1715702400000;

export const SEED_CONTAINER_CONTENT: Record<string, Record<string, unknown>> = {
  "about-workspace": {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "About This Workspace" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Welcome to your reading workspace. This tool helps you organize, annotate, and connect your reading materials \u2014 from books and articles to research papers and project documents.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "How It Works" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Pages are the building blocks of your workspace. Each page is a container that holds rich text content. You can link pages together using @mentions to create a web of knowledge.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Features" }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "Rich Text Editing" },
                  { type: "text", text: " \u2014 Format text with headings, bold, italic, lists, and more" },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "Page Linking" },
                  { type: "text", text: " \u2014 Use @mentions to reference other pages" },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "Visual Graph" },
                  { type: "text", text: " \u2014 See your knowledge structure as an interactive map" },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "Auto-save" },
                  { type: "text", text: " \u2014 Changes save automatically" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Get started by exploring the " },
          { type: "text", marks: [{ type: "bold" }], text: "Editor Playground" },
          { type: "text", text: " page, or create a new page of your own." },
        ],
      },
    ],
  },
  "editor-playground": {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Editor Playground" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This page demonstrates the editor\u2019s formatting capabilities. Use it as a sandbox to test features.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Text Formatting" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: "Bold" },
          { type: "text", text: ", " },
          { type: "text", marks: [{ type: "italic" }], text: "italic" },
          { type: "text", text: ", " },
          { type: "text", marks: [{ type: "strike" }], text: "strikethrough" },
          { type: "text", text: ", " },
          { type: "text", marks: [{ type: "code" }], text: "inline code" },
          { type: "text", text: ", and " },
          { type: "text", marks: [{ type: "underline" }], text: "underline" },
          { type: "text", text: "." },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "Sub-heading (Level 3)" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Lists" }],
      },
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Unordered list item" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Another item" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "A third item" }] }] },
        ],
      },
      {
        type: "orderedList",
        content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First step" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Second step" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Third step" }] }] },
        ],
      },
      {
        type: "taskList",
        content: [
          { type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Completed task" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Unfinished task" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Another task" }] }] },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Blockquote" }],
      },
      {
        type: "blockquote",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "This is a blockquote for highlighting important passages or quotations." }] },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Code Block" }],
      },
      {
        type: "codeBlock",
        content: [{ type: "text", text: "function hello() {\n  console.log(\"Hello, workspace!\");\n}" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Links & Highlight" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "You can add " },
          { type: "text", marks: [{ type: "link", attrs: { href: "https://tiptap.dev", target: "_blank" } }], text: "hyperlinks" },
          { type: "text", text: " and " },
          { type: "text", marks: [{ type: "highlight", attrs: { color: "var(--tt-color-highlight-yellow)" } }], text: "highlighted text" },
          { type: "text", text: "." },
        ],
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Tip: Delete everything and start typing to test from scratch." },
        ],
      },
    ],
  },
};

export const SEED_DATA: GraphSnapshot = {
  version: 3,
  entities: [
    {
      id: "about-workspace",
      kind: "container",
      content: "About This Workspace",
      createdAt: SEED_TS,
      updatedAt: SEED_TS,
      metadata: {},
    },
    {
      id: "editor-playground",
      kind: "container",
      content: "Editor Playground",
      createdAt: SEED_TS,
      updatedAt: SEED_TS,
      metadata: {},
    },
  ],
  relations: [],
};
