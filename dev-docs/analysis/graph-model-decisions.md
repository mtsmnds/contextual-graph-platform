# Graph Model Analysis — from `hello2/graph.json`

Capturing decisions as we reason through the data model together.
This feeds into PRD0010 (ID scheme), the hamlet restructuring PRD, and the entity model refinements.

---

## 1. Root container ID

The work's ID is `hamlet`, not the full title slugified.
- Full title `"THE TRAGEDY OF HAMLET, PRINCE OF DENMARK"` lives in the `title` field
- `hamlet` is the canonical short name — concise, human-recognizable
- If another work called "Hamlet" appears, it becomes `hamlet-1`

**Decision:** Root containers use a short canonical name as their ID. Collision → `-1`, `-2` suffix.

---

## 2. Author references

`metadata.author: "william-shakespeare"` is a pointer to a future entity.
- `william-shakespeare` will be an entity in the system (a container or concept node)
- Works link to authors via relations (e.g., `written-by` or `references`)
- The author's ID is also a short canonical slug

**Decision:** Entity IDs serve double duty as relation targets. An ID like `william-shakespeare` is both an entity identifier and a human-readable name.

---

## 3. Title page entity (seg_1)

Current (from hamlet.json):
```json
{
  "id": "seg_1",
  "kind": "segment",
  "title": "THE TRAGEDY OF HAMLET, PRINCE OF DENMARK",
  "content": "by William Shakespeare",
  "metadata": { "type": "title-page" }
}
```

Should be:
```json
{
  "id": "seg_1",  // will be renamed in hamlet restructuring PRD
  "kind": "segment",
  "content": "<h1>THE TRAGEDY OF HAMLET, PRINCE OF DENMARK</h1>\n<p>by William Shakespeare</p>",
  "metadata": { "type": "title-page" }
}
```

Changes:
- **No `title` field** — the title page is content, not a heading. Rendering is driven by `metadata.type: "title-page"`
- **Rich HTML content** — content preserves semantic HTML tags (`<h1>`, `<p>`). The renderer handles HTML, not raw text
- **Full title in content** — "THE TRAGEDY OF HAMLET, PRINCE OF DENMARK" moves from `title` to content as `<h1>`

**Decision:** Segments with `metadata.type` (structural segments like title-page, stage-direction, end-matter) don't need a `title`. Their rendering is driven by `metadata.type`. Content can contain HTML.

---

## 4. Character speeches

Current pattern:
```json
{
  "id": "seg_18",
  "kind": "segment",
  "title": "BARNARDO",
  "content": "BARNARDO.\nWho's there?",
  "metadata": { "character": "BARNARDO" }
}
```

Issues:
- `title` duplicates `metadata.character` — they always contain the same value
- `content` starts with `"BARNARDO.\n"` — the character name is duplicated again inside the content

Should be:
```json
{
  "id": "hamlet_act-01_scene-01_seg-0001",
  "kind": "segment",
  "content": "Who's there?",
  "metadata": { "character": "BARNARDO" }
}
```

Changes:
- **No `title` field** — the speaker label comes from `metadata.character`
- **Clean content** — no character prefix in the content text. The renderer prepends the character label
- **New ID following the scheme**

> Note: This also means `content` contains ONLY the spoken text for character speeches. Stage directions and narrative segments keep their full text. The renderer handles the distinction via `metadata.character` presence vs `metadata.type`.

**Decision:** Character speeches omit `title` and keep content clean (no character prefix). `metadata.character` is the single source for the speaker label.

---

## 5. Stage directions

```json
{
  "id": "seg_16",
  "kind": "segment",
  "content": "Enter Francisco and Barnardo, two sentinels.",
  "metadata": { "type": "stage-direction" }
}
```

This pattern is correct as-is. The renderer uses `metadata.type: "stage-direction"` to apply italic styling.

**Decision:** Stage directions keep `metadata.type: "stage-direction"`, no `title`. Content is the raw direction text.

---

## 6. Dramatis Personæ

Currently:
```json
{
  "id": "dramatis_5",
  "kind": "container",
  "title": "Dramatis Personæ",
  "content": "HAMLET, Prince of Denmark\n...",
  "metadata": { "type": "dramatis-personae" }
}
```

This is a container with content — unusual. Containers are supposed to be structural (no content of their own). Options:
- Demote to `kind: "segment"` with `metadata.type: "dramatis-personae"`
- Keep as container but move the list to child segments

Either way, it should be a direct child of `hamlet` (not an orphan).

**Decision:** TBD — will be resolved in the hamlet restructuring PRD.

---

## 7. Annotation/reference containers

Annotations don't live under the work's act/scene hierarchy. They have their own root-level containers:
- `hamlet-notes` → contains annotation entities
- `hamlet-references` → contains reference entities

Entities inside use the `ann-` or `ref-` prefix:
- `hamlet-notes_ann-identity-theme`
- `hamlet-references_ref-montaigne`

These containers sit alongside `hamlet` at the root level. Relations (`annotates`, `references`) link from work segments to annotation entities.

**Decision:** Annotations and references have their own root containers, independent of the source work's hierarchy.

---

## 8. Segment ID stability

IDs are derived from the entity's position at creation time and never recalculated:
- Renaming "Act I" to "Act One" does not change child IDs
- Reordering segments does not renumber counters
- Editing an annotation's title does not change its ID

This means IDs can become "stale" relative to current titles. The trade-off is accepted to avoid breaking relations.

**Decision:** IDs are immutable. Title changes don't propagate.

---

## 9. HTML in content

The `content` field can contain HTML for rich formatting:
- Title page: `<h1>`, `<p>`
- Verse text: `<i>` for stage directions within speeches
- Prose: plain text or `<p>` (future)

The renderer should handle both plain text and HTML. Detection: if content contains `<`, treat as HTML; otherwise, plain text.

**Decision:** `content` supports HTML. The renderer handles both plain text and rich content.

---

## 10. Relations for structure

The containment hierarchy uses `contains` relations. Examples from graph.json:
- `hamlet` → `seg_1` (title page)
- `hamlet` → `dramatis_5` (dramatis personae)
- `hamlet` → `act_11` (Act I)
- `act_11` → `scene_14` (Scene I)
- `scene_14` → `seg_16` (stage direction)
- `scene_14` → `seg_18` (Barnardo speech)

Segments have multiple `next` relations linking them in reading order.

**Decision:** The `contains` chain encodes the full hierarchy. The ID scheme mirrors it: `parent_child`. Relations remain the authoritative source of structure — IDs are a human-readable reflection, not the source of truth.

---

## 11. Hamlet keeps old IDs for now

The `hello2/graph.json` file keeps `seg_1`, `seg_18`, `act_11`, `scene_14`, etc. for now.
- A separate PRD will restructure the hamlet data with new IDs, corrected containment, and clean data
- That PRD will go through the file item by item with user input

**Decision:** Postpone hamlet migration. The ID scheme (PRD0010) applies to new entities created through the app.

---

## Open questions (still need to settle)

| # | Question | Status |
|---|----------|--------|
| A | Should containers ever have `content`? Dramatis Personæ does. | TBD — hamlet PRD |
| B | What's the correct character prefix format in rendered text? (e.g., "BARNARDO.\n" or a styled label) | TBD — renderer PRD |
| C | How does the import script determine segment boundaries for speeches? | TBD — hamlet PRD |
| D | Should `author` be a dedicated field or a relation? | TBD — model PRD |
| E | What entity `kind` should characters have? (segment for speeches, container for character profiles) | TBD |
