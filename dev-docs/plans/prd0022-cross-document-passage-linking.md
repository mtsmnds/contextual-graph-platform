# PRD0022: Cross-Document Passage Linking (Phase 2)

**Status:** Draft

---

## 1. The Problem

Phase 1 made any selected text addressable as a `passageAnchor` mark with a corresponding `annotation` entity in the graph. But those entities sit alone — they have no relations. The user can create passage A in document 1 and passage B in document 2, but there's no way to say "passage A references passage B." The graph has nodes but no edges between them.

Cross-document linking is what makes the system relational rather than just a collection of annotated documents. It's the mechanism behind "Sinno references Nabokov" — connecting a passage in one document to a passage in another.

## 2. What We're Building

A flow to create a `references` relation between two passage anchors. The user is in a document, has selected text and created a passage, and now wants to link it to a passage in another document.

### 2.1 The flow

1. User clicks passage creation, then clicks the passage (or right-clicks it, or clicks a "Link" indicator that appears on passages) → "Link to passage…" option appears
2. A dialog opens showing a search bar and a list of documents (containers)
3. User types to filter documents, selects one
4. A list of existing passages in that document appears (their auto-generated labels from `getPassageLabel()`)
5. User selects the target passage
6. A `Relation` is created: `Relation(source: currentPassage.id, target: targetPassage.id, type: "references")`
7. Optionally, user can add a comment on the relation (`metadata.comment`)
8. The relation is saved immediately, and both passages now show a gutter indicator

### 2.2 UI placement

Permanent inline indicator on every passage anchor. The `.passage-anchor` span renders a small link icon at the end of the marked text via CSS `::after`. Clicking the indicator opens the "Link to passage" dialog.

No BubbleMenu changes, no hover detection, no NodeView. The click is handled via `editorProps.handleClickOn` in the editor config, which detects clicks on `[data-passage-anchor]` elements and opens the dialog.

### 2.3 Relation model

```ts
Relation {
  id: "r_psg_link_001",
  source: "psg_triste_tigre_001",   // the passage in the source doc
  target: "psg_lolita_045",         // the passage in the target doc
  type: "references",
  metadata: {
    comment: "Sinno echoes Nabokov's framing device...",  // optional
    createdAt: 1747350000000,
  }
}
```

Adds `type: "quote"` to the `RelationType` union. Semantically specific — a quote is a deliberate cross-document reference of a specific passage. Distinct from `"references"` (broader, could reference a work or idea without quoting exact text).

### 2.4 Target passage picker dialog

A modal or popover with:

- **Header**: "Link passage to…"
- **Document search**: text input that filters root containers by title (reuses the `getRootContainers` + filter pattern from the mention popup, PRD0018)
- **Passage list**: when a document is selected, list all annotation entities where `metadata.sourceContainer === selectedDoc.id`. Each item shows the passage label from `getPassageLabel()`. Empty state: "No passages in this document yet."
- **Comment field** (optional): small text input below the passage list
- **Confirm button**: "Link" → creates the relation

Implementation reuse: the MentionPopup and `mentionSuggestionRenderer` from PRD0018 already show a shadcn Command dialog with keyboard nav and live filtering. The passage picker follows the same pattern — different data source (passages instead of containers), same UI mechanism.

### 2.5 Edge cases

- **Target has no passages**: show empty state with a link to "Create a passage in that document first"
- **Linking to the same passage**: disallow — user should select a different passage in the same document if needed
- **Self-link**: disallow — can't link a passage to itself (same entity id)
- **Deleting a passage that has relations**: handled by Phase 1's stale mechanism — entity is marked stale but its relations (and their comments) are preserved

## 3. Architecture

```
BubbleMenu (TiptapEditor.tsx)
  └── "Link to passage" button        — appears when cursor is in passageAnchor text
       └── PassageLinkDialog.tsx       — new component

PassageLinkDialog.tsx                  — new
  ├── document search (shadcn Command)
  ├── passage list (filtered by selected document)
  └── optional comment field
      → on confirm: store.addRelation(sourceId, targetId, "references", { comment })
```

### 3.1 No new store actions

`addRelation()` already accepts parameters matching this use case. The only addition is passing `metadata.comment` — which is already supported (`metadata: Record<string, unknown>`).

### 3.2 Gutter indicator

Phase 1 already described gutter indicators for passages with outgoing relations. This is the same mechanism — now passages will show indicators because they actually have relations. No additional work needed here in Phase 2.

## 4. Files Changed

| File | Change |
|------|--------|
| `src/components/tiptap/PassageLinkDialog.tsx` | **New** — dialog component with document search, passage list, comment field |
| `src/renderers/TiptapEditor.tsx` | Add "Link to passage" button to BubbleMenu when cursor is in passageAnchor text, opens dialog |

No schema changes. No store changes. No new dependencies.

## 5. Out of Scope (Phase 3+)

- Multi-column layout (Phase 3 — columns for target browsing)
- Drag-to-link (Phase 4)
- Metadata display / blockquote rendering (Phase 5)
- Rendering the linked passage inline in the reading viewport — Phase 2 only creates the relation. Display comes in Phase 5.

## 6. Decisions

- **Link indicator**: Permanent inline indicator rendered via CSS `::after` on the `.passage-anchor` span (subtle link icon at end of marked text). Clicking it opens the dialog via `editorProps.handleClickOn` detecting `[data-passage-anchor]` elements. No NodeView, no hover detection, no BubbleMenu complexity. Consistent with the existing gutter indicator metaphor — rendered inline instead of in a separate gutter because passages are inside TipTap documents, not rendered as segment cards.
- **Relation type**: `"quote"` — added to the `RelationType` union in `src/types/graph.ts`.
- **Passage list**: Flat list, filtered by document selection. No grouping.
