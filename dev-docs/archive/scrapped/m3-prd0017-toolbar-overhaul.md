> **STATUS: SCRAPPED — Not implemented. Retained for reference only.**

# PRD0017: Toolbar Overhaul — Notion-like Commands + Floating Menubar

**Status:** Draft

---

## 1. The Problem

The editor has a persistent top toolbar that:
- Is stuck to the top of the editor, spanning full viewport width — fights the future side-by-side document layout
- Contains Radix UI components (`@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`) that conflict with the project's Base UI stack
- Takes up vertical space even when unused
- Duplicates functionality that should live in `/` commands and drag handle

The Radix dependency caused a specific bug: Radix Popover nested inside TipTap's BubbleMenu (Floating UI) produces NaN coordinates.

## 2. What We're Building

Replace the persistent toolbar with a Notion-like interaction model:
- **`/` command menu** for block insertion (heading, paragraph, list, blockquote, etc.)
- **Floating Menubar** (shadcn/Base UI) as fallback — appears on editor focus, per-instance, collapsible
- **`+` button on drag handle** for quick block insertion
- All UI consistently using Base UI (shadcn), no Radix

## 3. Pass 1 — Strip toolbar + Floating Menubar

### 3.1 Remove persistent toolbar
- Delete the `Toolbar` component tree from `TiptapEditor.tsx` (lines 274–367)
- The `BubbleMenu` stays — provides inline formatting on text selection (bold, italic, strike, underline, code)
- Remove the mobile toolbar variants (ColorHighlightPopoverContent, LinkContent mobile views)

### 3.2 Remove Radix dependencies
- Delete `src/components/tiptap-ui-primitive/popover/` (4 files)
- Delete `src/components/tiptap-ui-primitive/dropdown-menu/` (entire directory)
- Uninstall `@radix-ui/react-popover` and `@radix-ui/react-dropdown-menu`
- Remove unused tiptap-ui component imports from TiptapEditor.tsx (HeadingDropdownMenu, ListDropdownMenu, ColorHighlightPopover, LinkPopover, BlockquoteButton, CodeBlockButton, TextAlignButton, ImageUploadButton, UndoRedoButton, and their subcomponents)

### 3.3 Install shadcn Menubar
```bash
npx shadcn@latest add menubar
```
This installs Base UI `Menubar` (`@/components/ui/menubar`) — fully in-stack.

### 3.4 Build floating Menubar component
Create `src/components/EditorMenubar.tsx`:
- Renders when the editor is focused (via `onFocus`/`onBlur` on the editor instance)
- Positioned as a floating element above the editor content (not at viewport top)
- Has a `+` toggle button to collapse/expand
- Contains: heading level, bold, italic, link, highlight — the essentials
- Each editor instance gets its own Menubar (via `key={entityId}` on the editor)

### 3.5 Clean up unused tiptap-ui components
After the old toolbar is removed, many tiptap-ui components are orphaned. List and remove:
- `src/components/tiptap-ui/heading-dropdown-menu/`
- `src/components/tiptap-ui/list-dropdown-menu/`
- `src/components/tiptap-ui/blockquote-button/`
- `src/components/tiptap-ui/code-block-button/`
- `src/components/tiptap-ui/text-align-button/`
- `src/components/tiptap-ui/undo-redo-button/`
- `src/components/tiptap-ui/image-upload-button/`
- `src/components/tiptap-ui/color-highlight-popover/` (replaced by simpler approach)
- `src/components/tiptap-ui/link-popover/` (replaced by Menubar's link input)
- `src/components/tiptap-ui/list-button/`, `src/components/tiptap-ui/heading-button/` (internal helpers)
- `src/components/tiptap-ui/color-highlight-button/` (internal helpers)
- `src/components/tiptap-icons/` (all — replace with `@phosphor-icons/react`)
- `src/components/tiptap-ui-primitive/` subcomponents that are no longer used

## 4. Pass 2 — Slash Commands + Drag Handle Plus

### 4.1 Build `/` command menu
`@tiptap/suggestion` is already installed. Build a proper `render` function for a second suggestion plugin keyed to `/`:

- Register a second `Suggestion` plugin with `char: "/"` and a unique `pluginKey`
- The `render` function shows a shadcn-styled popup listing available commands:
  - Text: paragraph, heading 1-3
  - Lists: bullet list, ordered list, task list
  - Blocks: blockquote, code block, horizontal rule
  - Media: image
- Use the existing Base UI `Popover` (`src/components/ui/popover.tsx`) for the popup
- On selection, execute the corresponding TipTap command (e.g., `editor.chain().focus().toggleHeading({ level: 1 }).run()`)

### 4.2 Add `+` to drag handle
The existing `DragHandle` React component positions a handle at each block. Add a `+` button alongside the drag dots:

```tsx
<DragHandle editor={editor} ...>
  <div className="flex items-center gap-0.5">
    <button onClick={() => openSlashMenu()}>+</button>
    <div className="drag-dots">⠿</div>
  </div>
</DragHandle>
```

Clicking `+` inserts a new paragraph block below the current block and opens the `/` command menu.

### 4.3 Polish floating Menubar
- Add keyboard shortcut indicators to Menubar items (⌘B, ⌘I, etc.)
- Style to match the shadcn theme (border, radius, background)
- Ensure it repositions correctly when editor container resizes

## 5. Files Changed

| Pass | File | Change |
|------|------|--------|
| 1 | `src/renderers/TiptapEditor.tsx` | Remove Toolbar JSX, remove unused imports |
| 1 | `src/components/EditorMenubar.tsx` | **New** — floating Menubar component |
| 1 | `src/components/tiptap-ui-primitive/popover/` | **Delete** (4 files) |
| 1 | `src/components/tiptap-ui-primitive/dropdown-menu/` | **Delete** (entire directory) |
| 1 | `src/components/tiptap-ui/*/` | **Delete** orphaned UI components |
| 1 | `src/components/tiptap-icons/` | **Delete** entire directory |
| 1 | `package.json` | Remove `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu` |
| 2 | `src/renderers/TiptapEditor.tsx` | Add slash command Suggestion plugin, add `+` to DragHandle |
| 2 | `src/components/SlashMenu.tsx` | **New** — `/` command menu render component |
| 2 | `dev-docs/roadmap.md` | Update Now/Next/Later with completed items |

## 6. Out of Scope

- Phosphor icon migration (separate pass)
- Side-by-side document layout (separate PRD)
- Mention-at-popup UI polish (Phase 3.3 of tiptap-ui plan)
