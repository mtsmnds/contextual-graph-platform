# TipTap–Graph Mapping Test Plan

**Status:** Draft (defines open questions to be answered through testing)
**Prerequisite:** TipTap installed and rendering entity content (PRD0013 Steps 2–4)
**Output:** Once conclusions are reached, an ADR is produced in `dev-docs/archive/`.

---

## 1. The Core Question

How does TipTap's document model (ProseMirror nodes + marks) map to our Entity/Relation graph?

Currently, each entity has `content?: string` (plain text or HTML). The reading viewport renders them as separate `SegmentCard` components. TipTap introduces a richer document model where the text itself has structure (paragraphs, headings, marks, inline nodes).

The mapping decision affects:
- How `Entity.content` is stored (HTML string vs. ProseMirror JSON)
- How the reading viewport renders (one TipTap instance per entity vs. one per container)
- How annotations attach to text (entity-level vs. position-in-document-level)
- How references between texts work

---

## 2. Two Models to Test

### Model A: One TipTap instance per entity

Each entity has its own TipTap document. `Entity.content` stores HTML (or ProseMirror JSON for that single entity).

```
Entity "seg_18" → TipTap doc: "Who's there?"
Entity "seg_21" → TipTap doc: "Nay, answer me."
```

- **Pro:** Simple. Current architecture unchanged. No migration needed.
- **Con:** Hamlet feels like fragments, not a flowing text. 1,349 separate TipTap instances. Annotations must cross-reference entity IDs rather than positions in a document.

### Model B: One TipTap document per container (work)

The container entity (`hamlet`) holds the full ProseMirror JSON document for the entire work. Individual segment entities still exist in the graph for relations and queries, but they reference positions in the container's ProseMirror document rather than holding their own content.

```
Container "hamlet" → one TipTap doc containing all acts, scenes, speeches
Segment "seg_18"  → { contentRef: { docId: "hamlet", path: ["act-1", "scene-1", "speech-3"] } }
```

- **Pro:** The text reads as one flowing document. Annotations attach to precise positions in the ProseMirror tree (via marks). TipTap's native selection/highlight/comment system maps directly to our annotation feature.
- **Con:** Requires content migration (Hamlet data restructured). Entity/content relationship changes. More complex architecture.

---

## 3. Test Scenarios

### Test 1: Current content via TipTap (Model A)

1. Load Hamlet through the reading viewport with TipTap rendering entity content
2. Verify each entity's content renders correctly (plain text → paragraph, HTML → rich text)
3. Measure performance: 1,349 TipTap instances, scroll through the full work
4. Does the reading experience feel like fragments or a flowing text?

**Pass condition:** No errors, scroll smooth, text readable. Subjective: "fragmented" is a known trade-off.

### Test 2: ProseMirror JSON format round-trip

1. Take a sample of Hamlet text (act I scene I = ~40 entities)
2. Convert to ProseMirror JSON (hand-write the doc structure)
3. Load into TipTap via `editor.setContent(proseMirrorJson)`, output via `editor.getJSON()`
4. Compare input and output JSON — does the round-trip preserve structure?

**Pass condition:** JSON round-trips without data loss. Structure (headings, paragraphs, stage directions) is preserved.

### Test 3: HTML vs. ProseMirror JSON output

1. Take the same sample text
2. Store it both as HTML and ProseMirror JSON
3. Render both in TipTap — visually compare
4. Compare file sizes in `graph.json`
5. Compare human-readability of both formats

**Questions to answer:**
- Is the HTML output from TipTap identical to what we currently store?
- Does ProseMirror JSON capture structure that HTML loses (e.g., paragraph boundaries, nested marks)?
- What's the size difference for Hamlet (1349 entities)?

### Test 4: Container-level document (Model B)

1. Take act I scene I from Hamlet
2. Build a single ProseMirror JSON document containing all entities in order
3. Load the document into TipTap — does it render as expected?
4. Can we map each ProseMirror node back to its source entity ID? Via `node.attrs.entityId`?

**Pass condition:** One flowing document. Each ProseMirror node carries a reference to its entity ID. The document can be split/reconstructed from entity data.

### Test 5: Annotations in ProseMirror

1. Using a single ProseMirror document (Model B), add a `highlight` mark to a text range
2. Export the document — is the mark preserved?
3. Import the document — is the mark still there?
4. Can we map a ProseMirror mark to an `annotates` relation in our graph?

**Pass condition:** Marks survive round-trip. Mapping between ProseMirror marks and graph relations is feasible.

### Test 6: Editable document + annotation creation

1. Using Model B, enable TipTalk editing on a container document
2. Select a text range, annotate it (requires custom extension or existing comment plugin)
3. When the user edits the text, do annotation positions shift correctly?
4. How does ProseMirror handle position tracking through edits?

**Pass condition:** Annotations survive edits (positions update via ProseMirror's mapping system). This validates the annotation creation feature.

---

## 4. Decision Criteria

| Criterion | Why it matters |
|-----------|---------------|
| Reading flow | Does the text feel like one document or many fragments? |
| Annotation viability | Can annotations attach to specific text ranges and survive edits? |
| Performance | 1,349+ TipTip instances vs. one large instance — which is faster? |
| Migration cost | How much existing data needs to change? |
| Architecture complexity | Does Model B require a new entity/content relationship? |
| Round-trip stability | Does the chosen format survive save/load cycles without loss? |
| Human-readability | Can we inspect `graph.json` and understand the content? |

---

## 5. Recommendations (to be filled after testing)

- **Content format:** [ HTML | ProseMirror JSON | both ]
- **Per-entity vs. per-container:** [ Model A | Model B | hybrid ]
- **Annotation approach:** [ entity-level relation | ProseMirror marks ]
- **Custom extensions needed:** [ list ]

---

## 6. Related Questions

- If we adopt ProseMirror JSON for container-level documents, does `Entity.content` change type from `string | undefined` to `ProseMirrorJson | undefined`?
- How does the File System Access API handle larger `graph.json` blobs? (ProseMirror JSON is more verbose than HTML.)
- Can we support both formats concurrently? (e.g., Hamlet uses HTML, new content uses ProseMirror JSON)
- Does the sidebar navigation ("Books" → "Hamlet") work the same way in both models?
