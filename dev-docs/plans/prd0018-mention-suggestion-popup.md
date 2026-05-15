# PRD0018: Mention Suggestion Popup (Phase 3.3)

**Status:** Draft

---

## 1. The Problem

The current suggestion popup for the `@` mention trigger is a non-functional stub (`TiptapEditor.tsx:207-225`):

```ts
render: () => {
  let dom: HTMLDivElement | null = null
  return {
    onStart: () => {
      dom = document.createElement("div")
      dom.className = "mention-suggestion"
      dom.textContent = "Loading..."
      document.body.appendChild(dom)
    },
    onUpdate: () => {},
    onExit: () => {
      if (dom) { dom.remove(); dom = null }
    },
  }
}
```

Issues:
- Shows static "Loading..." text — never renders actual items
- No keyboard navigation (arrow keys, Enter, Escape)
- No mouse interaction (click to select)
- No visual styling — just a bare `<div>` appended to `<body>`
- No positioning relative to cursor
- `onUpdate` is a no-op — items from the `items` callback are never displayed
- No `onKeyDown` handler

## 2. What We're Building

Replace the stub with a proper React-based suggestion popup that:
1. Appears when user types `@`
2. Lists matching root containers (from the existing `items` callback)
3. Updates as the user continues typing (live filter)
4. Supports keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
5. Supports mouse selection via click
6. Uses shadcn `Command` component (`@/components/ui/command`) for styled list with built-in keyboard nav
7. Positions itself near the `@` cursor position

## 3. Architecture

```
TiptapEditor.tsx          — Mention extension with new suggestion.render
├── suggestion.render()   — Factory returning { onStart, onUpdate, onExit, onKeyDown }
│   └── createRoot()      — Mounts MentionPopup React component into a DOM node
└── doc.body.appendChild  — Positioned absolute near cursor (via clientRect)

MentionPopup.tsx          — New React component
├── Command               — shadcn component (cmdk-based)
├── CommandInput          — Hidden input (filtering handled by cmdk)
├── CommandList           — Item list container
│   ├── CommandEmpty      — "No results found" state
│   └── CommandItem       — Per-container item (id + label)
└── useMentionKeyDown     — Bridges TipTap keyboard events to cmdk
```

### 3.1 Component: `MentionPopup`

File: `src/components/tiptap/MentionPopup.tsx`

```tsx
interface MentionPopupProps {
  items: { id: string; label: string }[]
  command: (item: { id: string; label: string }) => void
  onKeyDownRef: (handler: (event: KeyboardEvent) => boolean) => void
}
```

Uses `@shadcn/command` (`Command`, `CommandList`, `CommandItem`, `CommandGroup`, `CommandEmpty`). The `CommandInput` is rendered but visually hidden — filtering is managed by cmdk's built-in search, with the query tied to the current `@` prefix text.

The `onKeyDownRef` callback is called on mount to give the React component a way to handle keyboard events forwarded from the TipTap suggestion plugin. The component calls `event.preventDefault()` and `command()` on Enter, returns `true` for handled keys (to suppress ProseMirror processing) and `false` otherwise.

Mouse hover sets selected index visually; click on `CommandItem` fires `command()`.

### 3.2 Renderer Factory

File: `src/components/tiptap/mentionSuggestionRenderer.tsx`

```tsx
// Factory function implementing TipTap's Suggestion.render interface
// Uses createRoot from react-dom/client to mount MentionPopup
// into a DOM div, positions it via clientRect from the plugin props
```

Returns:
- `onStart(props)`: Create DOM div, `createRoot`, render `<MentionPopup>`, append to body, position
- `onUpdate(props)`: Re-render `<MentionPopup>` with new items
- `onKeyDown(props)`: Forward key event to MentionPopup via stored handler ref; return `true` if handled
- `onExit()`: Unmount root, remove DOM node

### 3.3 Wiring in TiptapEditor.tsx

Replace the inline `render: () => { ... }` with `render: mentionSuggestionRenderer()`.

## 4. Interaction Design

| Action | Behavior |
|--------|----------|
| Type `@` | Suggestion popup appears with list of root containers, filtered if query exists after `@` |
| Continue typing after `@` | List filters live via cmdk (matches `@Meeting` → "Meeting Notes") |
| ArrowDown / ArrowUp | Move selection through items (cmdk handles this natively) |
| Enter | Select currently highlighted item → insert mention node with `attrs.id` and `attrs.label` |
| Escape | Dismiss popup, no mention inserted |
| Click on item | Same as Enter — insert mention node |
| Click outside | Dismiss popup |
| No matches | Show `CommandEmpty` with "No results found" |

## 5. Visual Design

The popup uses shadcn's `Command` component with:

- `rounded-lg border bg-popover text-popover-foreground shadow-md`
- Max height: 200px (scrollable via `CommandList`'s built-in `max-h-[200px] overflow-y-auto`)
- Min width: 180px
- Each `CommandItem` shows: icon (Univero if using `@phosphor-icons/react` or a generic document icon) + entity title
- Selected item highlighted via shadcn's default `data-[selected]:bg-accent data-[selected]:text-accent-foreground`
- Empty state: "No matching containers"

Positioned absolutely at cursor coordinates from `props.clientRect` (TipTap provides the cursor bounding rect). Offset slightly below the cursor line.

## 6. Files Changed

| File | Change |
|------|--------|
| `src/components/tiptap/MentionPopup.tsx` | **New** — React component wrapping shadcn Command |
| `src/components/tiptap/mentionSuggestionRenderer.ts` | **New** — renderer factory for TipTap suggestion plugin |
| `src/renderers/TiptapEditor.tsx` | Replace inline `render: () => {...}` with `render: mentionSuggestionRenderer()` |
| `dev-docs/roadmap.md` | Mark Phase 3.3 as complete, move to Recently Completed |
| `dev-docs/changelog.md` | Add entry for completed suggestion popup |

## 7. Dependencies

```bash
npx shadcn@latest add command
```

This installs:
- `@/components/ui/command.tsx` — shadcn Command component (wraps `cmdk` + Base UI)
- Requires `cmdk` package (installed as dependency of the component)

No additional TipTap extensions needed — `@tiptap/extension-mention` and `@tiptap/suggestion` are already installed.

## 8. Acceptance Criteria

1. `@` triggers popup showing root container entities within 100ms
2. Typing `@Meet` filters to show only "Meeting Notes"
3. ArrowDown/ArrowUp cycle through items; Enter inserts mention node with correct `attrs.id` and `attrs.label`
4. Click on item inserts mention node
5. Click outside or Escape dismisses popup
6. No matches shows "No matching containers" empty state
7. Mention node renders as `<span data-type="mention" data-id="...">@Label</span>` in HTML and as a proper `{"type": "mention", "attrs": {"id": "...", "label": "..."}}` node in JSON
8. Popup is positioned near the `@` cursor (within reasonable bounds, does not overflow viewport)
9. Works in both light and dark mode (uses shadcn semantic tokens)
10. `npx tsc --noEmit` passes

## 9. Testing & Verification

No test framework is configured in the project. Verification is manual + type-checking.

### 9.1 Manual test procedure

Open the app, navigate to a Tiptap editor instance (e.g. Playground), and run through each scenario:

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Popup appears | Type `@` in an empty paragraph | A styled popup appears near the cursor listing "About This Workspace" and "Editor Playground" |
| 2 | Live filter | Type `@Play` | List filters to only "Editor Playground" |
| 3 | Keyboard selection | Type `@`, press ArrowDown, press Enter | Mention node inserted with `attrs.id = "editor-playground"` and `attrs.label = "Editor Playground"` |
| 4 | Mouse selection | Type `@`, click on "About This Workspace" | Mention node inserted for that entity |
| 5 | Escape dismiss | Type `@`, press Escape | Popup closes, no mention inserted, cursor continues in the paragraph |
| 6 | Click outside dismiss | Type `@`, click elsewhere in the editor | Popup closes |
| 7 | Empty state | Type `@zzzzz` | Popup shows "No matching containers" |
| 8 | Verify JSON output | After inserting a mention, call `editor.getJSON()` in dev console | See `{"type": "mention", "attrs": {"id": "about-workspace", "label": "About This Workspace"}}` |
| 9 | Verify HTML output | Call `editor.getHTML()` | See `<span data-type="mention" data-id="about-workspace">@About This Workspace</span>` |
| 10 | Position | Insert a mention at end of a long paragraph | Popup positions near the `@` without overflowing viewport |

### 9.2 Type checking

```bash
npx tsc --noEmit
```

Must pass with zero errors.

### 9.3 Build

```bash
npm run build
```

Must succeed. Monitor bundle size impact (command + cmdk).

### 9.4 Dark mode

Toggle system `prefers-color-scheme` or force dark mode in dev tools. Verify popup uses `bg-popover text-popover-foreground` theme tokens, no hardcoded colors.

## 10. Out of Scope

- **Mention navigation on click** (Phase 3.3 follow-up — needs `onClick` handler on mention NodeView)
- **Mention in non-root containers** (search scope is root containers only per Decision #4)
- **Slash commands popup** (separate PRD — uses same Suggestion plugin pattern with `char: "/"`)
- **Drag handle `+` button** (covered in toolbar overhaul PRD0017)
