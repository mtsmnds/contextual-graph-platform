# PRD0013 — TipTap + Page Navigation

**Date:** 2026-05-14
**Status:** Draft
**Milestone:** M2 — Reading Workspace (Current Sprint)

---

## Context

The reading viewport renders `Entity.content` as raw HTML via `ContentHtml` (`dangerouslySetInnerHTML`). There is no rich text editing, no document model, and no way to create or modify content through the UI. TipTap (ProseMirror) is the chosen editor — it affects the content storage format and must be integrated before annotation creation (Phase 4) and inline editing can be built.

Separately, the navigation model needs permanent, linkable URLs. Currently the URL sync (`?focused=X&anchor=Y`) works for reload recovery but doesn't encode which root container is active. The user needs predictable URLs like `?view=page&entity=playground` that work as permanent links.

---

## Scope

### In scope

1. **Three root containers** — seed `playground`, `books`, `roadmap` as root-level entities in the graph on first run
2. **Permanent URL navigation** — canonical URL format `?view=page&entity=<id>`; reload restores exact view
3. **TipTap installation + reading viewport wiring** — TipTap renders `Entity.content` in read-only mode, replacing `ContentHtml`
4. **Content format lock** — `Entity.content` stores HTML produced by TipTap (`editor.getHTML()`)
5. **Node/mark-to-Entity/Relation mapping analysis** — exploration producing an ADR

### Out of scope

- Editable TipTap (write mode) — follow-up PRD
- shadcn toolbar/styling for TipTap — follow-up
- Annotation creation — Phase 4, depends on editable TipTap
- SegmentCard editing UX — partially covered by read-only integration; full editing UX deferred

---

## Implementation Plan

### Step 1 — Three root containers + seed data

**Problem:** On first run (empty `graph.json`), the graph has zero entities. The user picks a folder and gets an empty canvas with no guidance.

**Solution:** Add a first-run seed data generator in `useGraphStore.ts`:

```ts
function createSeedEntities(): { entities: Entity[]; relations: Relation[] } {
  const entities: Entity[] = [
    { id: "playground", kind: "container", title: "Playground", content: undefined, metadata: { type: "playground" } },
    { id: "books", kind: "container", title: "Books", content: undefined, metadata: { type: "workspace" } },
    { id: "roadmap", kind: "container", title: "Roadmap", content: undefined, metadata: { type: "roadmap" } },
  ];
  return { entities, relations: [] };
}
```

Trigger: after `openFolder()` or `restoreFolder()` resolves with empty arrays, apply seed data automatically (no prompt). The user can delete containers they don't need.

**URL navigation update:**

Current format: `?focused=X&anchor=Y`
New format: `?view=page&entity=<id>`

- `view` param: `"page"` | `"tree"` | `"graph"` (default `"page"`)
- `entity` param: the focused entity ID (renamed from `focused`)

Backward compat: if `?focused=X` is present (no `view` or `entity`), treat `view=page` and `entity=X`.

Update `updateUrl()` and `getViewParams()` in `App.tsx`.

---

### Step 2 — TipTap installation

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

| Package | Role |
|---------|------|
| `@tiptap/react` | React bindings (`useEditor`, `EditorContent`) |
| `@tiptap/pm` | ProseMirror core (peer dependency) |
| `@tiptap/starter-kit` | Essential extensions: doc, paragraph, text, bold, italic, strike, code, heading, bulletList, orderedList, blockquote, codeBlock, horizontalRule, history |

No additional extensions for MVP.

---

### Step 3 — RichTextContent component

Create `src/renderers/RichTextContent.tsx`:

```tsx
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

interface RichTextContentProps {
  content: string
  className?: string
}

function RichTextContent({ content, className }: RichTextContentProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
  })

  if (!editor) return null

  return <EditorContent editor={editor} className={className} />
}

export default RichTextContent
```

### Step 4 — Replace ContentHtml

In `ReadingViewport.tsx`:

- Delete `ContentHtml` function
- Import `RichTextContent`
- Replace every `<ContentHtml ... />` with `<RichTextContent ... />`
- Same `className` passthrough; same placement in the component tree

The rendering behavior should be visually identical for Hamlet content since TipTap renders HTML faithfully.

### Step 5 — Content format specification

**Decision:** `Entity.content` stores HTML strings produced by `editor.getHTML()`.

Rationale:
- HTML is TipTap StarterKit's native output
- Human-readable in `graph.json` dumps
- Renderable without TipTap (graceful degradation)
- ProseMirror JSON is more precise but adds serialization complexity without immediate benefit

**Round-trip guarantee:** Content written by TipTap must survive `getHTML() → setContent() → getHTML()` without changes.

---

### Step 6 — Node/mark mapping ADR

**Task:** Produce an ADR documenting how TipTap nodes/marks map to Entity/Relation types.

Questions to answer:
- Does a `mention` node extension correspond to a `references` relation?
- Does a `highlight` mark map to an `annotation` entity with type `annotates`?
- How does a single TipTap document relate to a single entity's `content` field?
- What custom extensions are needed (passage references, annotations as inline marks)?
- Should content reference other entities via ID, or via text + fuzzy anchor?

**Output:** `dev-docs/archive/ADR-tiptap-node-mark-mapping.md`

---

## Modified Files

| File | Change |
|------|--------|
| `src/store/useGraphStore.ts` | Add `createSeedEntities()` call in `openFolder()`/`restoreFolder()` when entities are empty |
| `src/App.tsx` | URL format: `?view=page&entity=<id>`. Backward compat with `?focused`. Add `view` param awareness. |
| `src/renderers/ReadingViewport.tsx` | Replace `ContentHtml` usage with `RichTextContent`. Delete `ContentHtml` function. |
| `src/renderers/RichTextContent.tsx` | **New file** — TipTap-based read-only content renderer |
| `dev-docs/archive/ADR-tiptap-node-mark-mapping.md` | **New file** — Analysis of TipTap node/mark ↔ Entity/Relation alignment |

---

## Design Decisions

### Read-only first

TipTap in editable mode introduces: focus management, dirty state, save triggers, undo history, cursor synchronization. By shipping read-only first, we validate:
- Content renders correctly through TipTap
- No visual regressions in Hamlet (1,349 entities)
- HTML round-trip stability
- TipTap doesn't conflict with React Flow canvas or shadcn styles

Editing mode is a separate concern — add incrementally (double-click to edit, save on blur, auto-save on content change).

### HTML over ProseMirror JSON

ProseMirror JSON stores the full document state (marks, attributes, positions). It's more precise but:
- Not human-readable in `graph.json` dumps
- Adds `getJSON()` / `setContent(json)` complexity
- Requires migration if storage format changes

HTML is sufficient for MVP. TipTap reads both formats, so upgrading to JSON later is straightforward.

### Three root containers

- **Playground**: zero-config experimentation. Create entities, test features, no data to lose.
- **Books**: Hamlet lives here. Future texts imported here. The reading workspace.
- **Roadmap**: Self-hosting the project roadmap (future). Empty container ready to receive data.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| TipTap conflicts with existing shadcn / Tailwind styles | TipTap is headless — `EditorContent` renders a plain div. Scoped via `className`. |
| Large Hamlet (1,349 entities) causes TipTap perf issues | Each entity is its own TipTap instance (one per SegmentCard). No single large document. |
| HTML round-trip loses content richness | Verify with Hamlet's full HTML output. Compare rendered result visually. |
| URL format change breaks existing navigation | Backward compat: detect old `?focused` param and normalize to `?view=page&entity=`. |

---

## Verification

```
npm install              # installs @tiptap/*
npx tsc --noEmit         # no type errors
npm run build            # production build succeeds
```

Manual testing:
1. Open a new folder → see three root containers listed in sidebar
2. Click "Books" → Hamlet renders via TipTap (visually identical to before)
3. Click "Playground" → empty container, no errors
4. Reload page → same entity focused (URL restored)
5. Copy URL, open in new tab → same view restored
