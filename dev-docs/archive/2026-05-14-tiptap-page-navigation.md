# PRD0013 — TipTap + Page Navigation

**Date:** 2026-05-14
**Status:** Draft
**Milestone:** M2 — Reading Workspace (Current Sprint)

---

## Context

The reading viewport renders `Entity.content` as raw HTML via `ContentHtml` (`dangerouslySetInnerHTML`). There is no rich text editing, no document model, and no way to create or modify content through the UI. TipTap (ProseMirror) is the chosen editor — it affects the content storage format and must be integrated before annotation creation (Phase 4) and inline editing can be built.

Separately, the navigation model needs permanent, linkable URLs. Currently the URL sync (`?focused=X&anchor=Y`) works for reload recovery but doesn't encode the active view mode. Adding a `view` param distinguishes page/tree/graph while keeping the existing `focused` + `anchor` for breadcrumb preservation.

---

## Scope

### In scope

1. **Three root containers** — add `playground`, `books`, `roadmap` as entities in `hello2/graph.json`
2. **Permanent URL navigation** — add `view` param to existing URL format (`?view=page&focused=X&anchor=Y`)
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

### Step 1 — Three root containers

Add three entities to `hello2/graph.json`:

```json
{ "id": "playground", "kind": "container", "title": "Playground", "metadata": { "type": "playground" } },
{ "id": "books", "kind": "container", "title": "Books", "metadata": { "type": "workspace" } },
{ "id": "roadmap", "kind": "container", "title": "Roadmap", "metadata": { "type": "roadmap" } }
```

No code changes — just a data edit. These are the landing containers the user navigates into from the sidebar.

**URL navigation update:**

Current format: `?focused=X&anchor=Y`
New format: `?view=page&focused=X&anchor=Y`

- `view` param: `"page"` | `"tree"` | `"graph"` (default `"page"`)
- `focused` and `anchor` params: unchanged (existing breadcrumb preservation)

Update `updateUrl()` and `getViewParams()` in `App.tsx` to include `view`.

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

### Step 5 — Content format exploration

**Open question:** `Entity.content` format is not yet decided. Two candidates:

- **HTML** (`editor.getHTML()`) — human-readable, renderable without TipTap, simple
- **ProseMirror JSON** (`editor.getJSON()`) — richer structure, native annotation support via marks, position-tracking through edits

The PRD currently specifies HTML as the initial format for simplicity. The ProseMirror JSON path is interesting because TipTap nodes (paragraph, heading, etc.) map naturally to our segment entities — a work's full text could be one ProseMirror document with each segment as a node. Annotations in ProseMirror work via `marks` on precise text positions, which is exactly how highlight + annotate should behave.

**Decision deferred.** Both formats will be tested. See the test plan in `dev-docs/plans/tiptap-graph-mapping-test-plan.md` (Test 2, Test 3) for comparison methodology. Until the format is settled, `Entity.content` remains `string` (HTML-compatible text).

---

### Step 6 — TipTap–graph mapping test plan

**Moved to separate document.** The mapping between TipTap nodes/marks and our Entity/Relation graph needs hands-on testing before conclusions can be drawn. See `dev-docs/plans/tiptap-graph-mapping-test-plan.md` for the full test plan.

This step is deferred until TipTap is installed and rendering (Steps 2–5 complete). The test plan lives in `dev-docs/plans/` as a living document — updated as tests are run and conclusions are reached. Once mapping rules are settled, an ADR will be produced.

---

## Modified Files

| File | Change |
|------|--------|
| `hello2/graph.json` | Add three root container entities: `playground`, `books`, `roadmap` |
| `src/App.tsx` | Add `view` param to URL sync (`?view=page&focused=X&anchor=Y`). Default `"page"`. |
| `src/renderers/ReadingViewport.tsx` | Replace `ContentHtml` usage with `RichTextContent`. Delete `ContentHtml` function. |
| `src/renderers/RichTextContent.tsx` | **New file** — TipTap-based read-only content renderer |
| `dev-docs/plans/tiptap-graph-mapping-test-plan.md` | **New file** — Test plan for TipTap↔graph mapping (Step 6, deferred) |

---

## Design Decisions

### Read-only first

TipTap in editable mode introduces: focus management, dirty state, save triggers, undo history, cursor synchronization. By shipping read-only first, we validate:
- Content renders correctly through TipTap
- No visual regressions in Hamlet (1,349 entities)
- HTML round-trip stability
- TipTap doesn't conflict with React Flow canvas or shadcn styles

Editing mode is a separate concern — add incrementally (double-click to edit, save on blur, auto-save on content change).

### Content format: HTML vs. ProseMirror JSON

**Not yet decided.** The PRD specifies HTML as the starting format because it's simple and matches the existing `content: string` type. However, ProseMirror JSON has compelling advantages:

- **Structural fidelity** — TipTap's own node types (paragraph, heading, blockquote) map directly to our segment concepts (speech, stage-direction, scene). A work could be one ProseMirror document.
- **Native annotation model** — ProseMirror marks attach to precise text ranges and survive edits via position mapping. This is exactly what highlight + annotate needs.
- **Single document feeling** — a whole act rendered as one TipTap document instead of 100+ separate instances.

The format decision is deferred to the test plan (`dev-docs/plans/tiptap-graph-mapping-test-plan.md`). TipTap reads both formats, so switching later is low-risk.

### Three root containers

- **Playground**: zero-config experimentation. Create entities, test features, no data to lose.
- **Books**: Hamlet lives here. Future texts imported here. The reading workspace.
- **Roadmap**: Self-hosting the project roadmap (future). Empty container ready to receive data.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| TipTap conflicts with existing shadcn / Tailwind styles | TipTap is headless — `EditorContent` renders a plain div. Scoped via `className`. |
| Large Hamlet (1,349 entities) causes TipTap perf issues | Test both models: per-entity instances vs. single container-level document. Decision deferred to test plan. |
| Content format choice locks architecture | TipTap reads both HTML and ProseMirror JSON — format switch is low-risk. |
| URL format change breaks existing links | Product not live — no backward compat needed. Old `?focused` URLs will lack `view` param but app defaults to `"page"`. |

---

## Verification

```
npm install              # installs @tiptap/*
npx tsc --noEmit         # no type errors
npm run build            # production build succeeds
```

Manual testing:
1. Load `hello2/` folder → see three root containers (playground, books, roadmap) in sidebar
2. Click "Books" → navigate into it, see Hamlet
3. Click "Playground" → empty container, no errors
4. Reload page → same entity focused, same view mode (URL restored)
5. Copy URL, open in new tab → same view restored
