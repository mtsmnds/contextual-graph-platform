# TipTap UI Plan — Scaffold → Notion-like

## Principle

Use TipTap's full editor and component ecosystem as-is. "Leave our own schema in the freezer" — test and leverage TipTap's natives before building domain-specific extensions. The storage format (HTML vs ProseMirror JSON) is orthogonal to UI; we decide it later.

## Pricing Map (2026)

| Feature | License | Source |
|---------|---------|--------|
| **Simple Editor template** | MIT (free) | `npx @tiptap/cli@latest add simple-editor` |
| **BubbleMenu** | Free | `@tiptap/react` → `@tiptap/react/menus` |
| **FloatingMenu** | Free | `@tiptap/react` → `@tiptap/react/menus` |
| **Drag Handle React** | Free | `@tiptap/extension-drag-handle-react` |
| **All StarterKit extensions** | Free | `@tiptap/starter-kit` |
| **Underline, Highlight, TextAlign, TaskList, Table, Link, Placeholder, Emoji, Mention** | Free | Individual `@tiptap/extension-*` packages |
| **Slash dropdown menu** | Start plan (paid) | TipTap Cloud |
| **Drag context menu** | Start plan (paid) | TipTap Cloud |
| **Notion Editor template** | Start plan (paid) | TipTap Cloud |
| **Collaboration, AI** | Start plan (paid) | TipTap Cloud |

The free tier covers everything needed for a single-player notion-like editor. The paid tier adds slash commands UI, drag context menus, collaboration, and AI.

---

## Phase 1 — Simple Editor (free, MIT)

**Goal:** Replace the current bare `RichTextContent` with the full Simple Editor template including toolbar, all standard formatting, image upload, and link popover.

### Steps

#### 1.1 Install SCSS support

The TipTap UI Components system uses SCSS. Vite needs the `sass` compiler.

```bash
npm install -D sass
```

Check: does `npm run dev` compile `.scss` files without errors?

#### 1.2 Scaffold Simple Editor via CLI

```bash
npx @tiptap/cli@latest add simple-editor
```

This creates:
- `src/components/tiptap-templates/simple/simple-editor.tsx`
- `src/components/ui/` (all required UI primitives + components)
- SCSS imports in `src/index.css`

#### 1.3 Verify integration

- Import `SimpleEditor` in a test page or replace `RichTextContent` editing area with it
- Confirm toolbar renders: bold, italic, underline, heading dropdown, lists, alignment, blockquote, code, link, undo/redo, image upload
- Confirm dark/light mode matches our theme

#### 1.4 Wire into Playground

Replace the current editable `RichTextContent` on Playground with `SimpleEditor`. Content saves via `editor.getHTML()` → `updateEntity()` (same flow as today).

### Deliverables

- Toolbar with formatting controls (no more bare contenteditable)
- Image upload (via TipTap's image upload node component)
- Link popover
- Dark/light mode
- Undo/redo

---

## Phase 2 — Free Notion-like Delta

**Goal:** Add "block editor" features on top of Simple Editor using free extensions. This is the delta between Simple Editor and a Notion-like editor (single-player features only).

### 2.1 Bubble menu (free)

Add a floating toolbar that appears on text selection (bold, italic, link, highlight).

```tsx
import { BubbleMenu } from "@tiptap/react/menus"

<BubbleMenu editor={editor}>
  <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
  <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
  <button onClick={() => editor.chain().focus().toggleLink({ href: "" }).run()}>Link</button>
</BubbleMenu>
```

### 2.2 Drag handle (free)

Add block drag handles via `@tiptap/extension-drag-handle-react`. Lets users reorder blocks (paragraphs, headings, lists) by dragging.

```bash
npm install @tiptap/extension-drag-handle-react @tiptap/extension-drag-handle @tiptap/extension-node-range
```

```tsx
import DragHandle from "@tiptap/extension-drag-handle-react"

<DragHandle editor={editor}>
  <div className="drag-handle" />
</DragHandle>
<EditorContent editor={editor} />
```

### 2.3 Additional free extensions

Install and register:

| Extension | Package | What it adds |
|-----------|---------|-------------|
| Underline | `@tiptap/extension-underline` | Ctrl+U underline |
| Highlight | `@tiptap/extension-highlight` | `<mark>` highlighting |
| TextAlign | `@tiptap/extension-text-align` | Left/center/right/justify |
| TaskList | `@tiptap/extension-task-list` + `task-item` | Checkbox todo items |
| Placeholder | `@tiptap/extension-placeholder` | "Start writing..." placeholder text |
| Emoji | `@tiptap/extension-emoji` | `:smile:` emoji autocomplete |
| Typography | `@tiptap/extension-typography` | Smart quotes, dashes, ellipsis |

### 2.4 Slash commands (paid — defer decision)

The `/` command menu is a Start plan feature. Options:
- **Option A (paid):** Use TipTap's `slash-dropdown-menu` component → Start plan subscription needed
- **Option B (free):** Build a basic slash menu using the free `SuggestionMenu` utility component + custom logic. Less polished, no ongoing cost.
- **Decision gate:** Try Option B first. If it's too much effort, evaluate paid plan.

### Deliverables

- Floating toolbar on text selection
- Block drag-and-drop reordering
- Richer formatting: underline, highlight, text align, task lists, emoji
- Placeholder text in empty editors

---

## Phase 3 — Multi-Document Test (Two Files + Mentions) ✅

**Goal:** Validate the architecture split by creating two real TipTap documents, linking them with mentions, and inspecting the raw data.

~~Old Phase 3 goal (abstract schema alignment) superseded. Architecture split is clear: Graph handles document inventory + cross-doc relations. TipTap handles document internals.~~

### 3.1 Create two TipTap documents ✅

- Storage switched to `JSON.stringify(editor.getJSON())` — content stores as TipTap JSON in `Entity.content`
- Legacy HTML handled via `parseContent()` fallback in both `TiptapEditor` and `RichTextContent`
- `graph.json` inspected — each entity's `content` is a TipTap JSON blob, graph never parses it

### 3.2 Install Mention extension ✅

- `@tiptap/extension-mention` + `@tiptap/suggestion` installed
- Configured with `suggestion.items` querying `getRootContainers` from the graph store
- `TitleDocument` extension: custom Document node with `content: "heading block+"` — first block is always a heading (the title)
- Title auto-syncs to `entity.title` on edit
- Drag handle hidden on the title heading

### 3.3 mention suggestion popup ✅ - prd0018
  - inline char triggers interface. shows when user types `@`.
  - Uses `@shadcn/command` (cmdk) wrapped in a `MentionPopup` React component, mounted via `createRoot` in the TipTap suggestion plugin's `onStart`/`onUpdate` lifecycle.

  - shows when user types `@`
  - lists matching root containers, live-filtered as user types
  - inserts mention node with `attrs.id` and `attrs.label`
  - cursos positioned popup, viewport-aware

### fix drag handle ✅
  - drag handle problem: not the right size; not aligned with text line
  - documentation
    - https://tiptap.dev/docs/editor/extensions/functionality/drag-handlev
    - phosphor icon: dots-six-vertical

  - should be correctly sized and aligned with text line
  - add an ease-in and ease-out so it doesn't "follow the user around" when scrolling

#### solution
  - swapped custom SVG for `DotsSixVertical` from `@phosphor-icons/react`
  - resized to 24x24 with flex centering, aligned with text line height
  - added `opacity` CSS transition (200ms ease-in-out) instead of conditional rendering, so the handle fades in/out smoothly instead of snapping
  - hidden on title heading via `pointerEvents: "none"` + `opacity: 0`
  - test with dev tools mcp


- mention suggestions
  - inline char triggers interface. as the user types in the editor:
    - typing "@" will allow mentioning files
    - typing "/" will show the toolbar popover (notion-like commands menu) 



### 3.3 Link documents with mentions ✅

- Mention suggestion popup (PRD0018) — `/`trigger popup listing root containers, keyboard nav, live filter, viewport-aware positioning
- Live title resolution (PRD0019) — custom React NodeView resolves entity title from graph store via `attrs.id` instead of static `attrs.label`. Click navigates to entity (read-only: plain click; editable: Cmd/Ctrl-click). Mentions render in both editable and read-only modes.

1. In document A, type `@Meeting Notes` → the Mention extension creates an inline node
2. In document B, type `@Projects Overview` → same
3. Inspect the resulting content:

```
editor.getJSON() → shows mention nodes with entity IDs:
{
  "type": "doc",
  "content": [{
    "type": "paragraph",
    "content": [
      { "type": "text", "text": "See " },
      {
        "type": "mention",
        "attrs": {
          "id": "container-meeting-notes",
          "label": "Meeting Notes"
        }
      },
      { "type": "text", "text": " for details." }
    ]
  }]
}
```

```
editor.getHTML() → mention rendered as a <span> with data attributes:
<p>See <span data-type="mention" data-id="container-meeting-notes">@Meeting Notes</span> for details.</p>
```

### local storage but good now - prd0020 ✅

### 3.4 decision: json storage ✅
- leverage prosemirror and tiptap advantages instead of wasing time building parity




### 3.5 Default schema per container (Model A confirmed)

Each container entity gets its own TipTap editor instance with its own content. This is Model A from the test plan — confirmed by the architecture split.

```ts
// One TipTap editor instance per container entity
<EditorContent editor={editor} />  // container A
<EditorContent editor={editor} />  // container B
```

No shared document, no position-based cross-references between containers. Cross-doc links happen via the Mention extension (which stores entity IDs in `attrs`), and the graph handles the navigation when clicked.

### 3.6 Lock in default extensions

```ts
extensions: [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Underline,
  Highlight,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TaskList,
  TaskItem,
  Placeholder.configure({ placeholder: "Start writing..." }),
  Emoji,
  Typography,
  BubbleMenu,
  DragHandle,
  Mention.configure({
    suggestion: { /* graph-backed items */ },
  }),
]
```

---

## Phase 4 — Quality & Performance

### 4.1 Isolate editor component

Per TipTap's performance guide: isolate the editor in a separate component to prevent unrelated renders from rebuilding the ProseMirror document.

**Current problem:** `RichTextContent` is embedded inside `ReadingViewport` which subscribes to `entities` and `relations` — any store change rebuilds all editors.

**Fix:** Move the editable TipTap instance into its own component with minimal subscriptions. Use `React.memo` or separate store slices.

### 4.2 useEditorState for toolbar

Use `useEditorState` for toolbar button active states instead of subscribing to the editor on every transaction:

```tsx
const isBold = useEditorState({
  editor,
  selector: ({ editor }) => editor.isActive("bold"),
})
```

### 4.3 Debounced saves

Keep the existing auto-save (300ms debounce in store). The `onUpdate` callback writes to the store via `updateEntity()`, which triggers auto-save. No additional debounce needed.

### 4.4 Bundle size

The Simple Editor + extensions will increase the JS bundle. Monitor via `npm run build` output (currently ~925 KB gzipped to 294 KB). Consider dynamic imports for heavy extensions (e.g., image upload, table) if they're not always needed.

---

## Execution Order

```
Phase 1 (Simple Editor scaffold)
  ├── 1.1 Install sass
  ├── 1.2 CLI add simple-editor
  ├── 1.3 Verify renders
  └── 1.4 Wire into Playground

Phase 2 (Free Notion delta)
  ├── 2.1 BubbleMenu
  ├── 2.2 Drag Handle
  ├── 2.3 Additional extensions
  └── 2.4 Slash commands decision gate

Phase 3 (Multi-document test)
  ├── 3.1 Create two TipTap documents ✅
  ├── 3.2 Install Mention extension ✅
  ├── 3.3 Build suggestion popup ✅ (PRD0018)
  ├── 3.4 Decide: JSON vs HTML storage ✅ (JSON wins)
  ├── 3.5 Confirm Model A (per-container editors) ✅
  └── 3.6 Lock in default extensions ✅

Phase 4 (Performance)
  ├── 4.1 Isolate editor component
  └── 4.2 useEditorState optimizations
```

Phases 1 and 2 are pure UI — they don't affect the storage format or entity model. Phase 3 validates the architecture split (graph ↔ TipTap) with a concrete cross-document test.

---

## Open Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Slash commands: pay for Start plan or build basic version with SuggestionMenu? | TBD after Phase 1 |
| 2 | Image upload: needs a server endpoint. Use local file storage or skip? | TBD |
| 3 | Do we replace `RichTextContent` everywhere (including read-only Hamlet) with the new editor, or keep `RichTextContent` for read-only and use the new editor only for editable containers? | Probably keep both: `RichTextContent` for read-only display (lighter), full editor for editing. |
| 4 | Mention extension: does `@` trigger search across all entities or only root containers? | Only root containers for now — TBD if we expand |
| 5 | Mention navigation: clicking a mention in read-only mode should navigate to the referenced entity? | Yes — needs `onClick` handler on mention NodeView (3.3 follow-up, deferred) |
| 6 | Storage format: JSON or HTML for entity content? | **JSON** — switched in Phase 3.1. HTML fallback for legacy data via `parseContent()` |
