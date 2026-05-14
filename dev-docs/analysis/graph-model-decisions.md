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

## 3. Containers never have content

Every container that originally had inline content was restructured: the content was moved to a single child segment. The container is structural only (title + metadata).

**Applies to:**
- `hamlet_title-page` — child: `hamlet_title-page_content` (HTML `<h1>` + `<p>`)
- `hamlet_about-the-ebook` — child: `hamlet_about-the-ebook_content`
- `hamlet_dramatis-personae` — child: `hamlet_dramatis-personae_content`
- `scene_*` — each has child: `scene_*_content`
- `hamlet_end-matter_transcribers-notes` — child: `hamlet_end-matter_transcribers-notes_content`
- `hamlet_end-matter_license` — child: `hamlet_end-matter_license_content`

**Child segment ID convention:** `[container-id]_content`

**Decision:** Containers are structural labels only — they have `title` and `metadata` but never `content`. Content lives in child segments.

---

## 4. Character speeches — no title, clean content

Before:
```json
{
  "id": "seg_18",
  "title": "BARNARDO",                    // duplicates metadata.character
  "content": "BARNARDO.\nWho's there?",   // prefix duplicates character
  "metadata": { "character": "BARNARDO" }
}
```

After (applied to all 1132 speeches):
```json
{
  "id": "seg_18",
  "content": "Who's there?",
  "metadata": { "character": "BARNARDO" }
}
```

**1132 segments transformed** — `title` removed, `CHARACTER.\n` prefix stripped from `content`. Zero data loss (every prefix was verified present before stripping, case-insensitive matching for joint speakers like `CORNELIUS AND VOLTEMAND` → `CORNELIUS and VOLTEMAND.\n`).

**Decision:** Segments never have a `title` field.

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

This pattern is correct as-is. The renderer uses `metadata.type: "stage-direction"` to apply italic styling. No `title`.

**Decision:** Stage directions keep `metadata.type: "stage-direction"`, no `title`. Content is the raw direction text.

---

## 6. Scene containers — content moved to child segments

Scenes are containers with a heading (`title`) and location description. Following the container rule, the location description was moved to a child segment:

```json
{
  "id": "scene_14",
  "kind": "container",
  "title": "SCENE I. Elsinore. A platform before the Castle.",
  "metadata": { "type": "scene" }
  // content moved to scene_14_content
}
```

**20 scenes transformed** — each has a `_content` child segment now.

---

## 7. End-matter pattern

A dedicated `hamlet_end-matter` container holds Transcriber's Notes and License:

```
hamlet_end-matter (container, type: end-matter)
├── hamlet_end-matter_transcribers-notes (container)
│   └── hamlet_end-matter_transcribers-notes_content (segment)
└── hamlet_end-matter_license (container)
    └── hamlet_end-matter_license_content (segment)
```

The `next` chain: `hamlet_act-v → hamlet_end-matter → transcribers-notes → license`

**Decision:** Dedicated end-matter container. All structural content follows the container → child segment pattern.

---

## 8. Annotation/reference containers

Annotations don't live under the work's act/scene hierarchy. They have their own root-level containers:
- `hamlet-notes` → contains annotation entities
- `hamlet-references` → contains reference entities

Entities inside use the `ann-` or `ref-` prefix:
- `hamlet-notes_ann-identity-theme`
- `hamlet-references_ref-montaigne`

These containers sit alongside `hamlet` at the root level. Relations (`annotates`, `references`) link from work segments to annotation entities.

**Decision:** Annotations and references have their own root containers, independent of the source work's hierarchy.

---

## 9. Segment ID stability

IDs are derived from the entity's position at creation time and never recalculated:
- Renaming "Act I" to "Act One" does not change child IDs
- Reordering segments does not renumber counters
- Editing an annotation's title does not change its ID

**Decision:** IDs are immutable. Title changes don't propagate.

---

## 10. HTML in content

The `content` field can contain HTML for rich formatting:
- Title page: `<h1>`, `<p>`
- Verse text: `<i>` for stage directions within speeches (future)
- Prose: plain text or `<p>` (future)

The renderer should handle both plain text and HTML. Detection: if content contains `<`, treat as HTML; otherwise, plain text.

**Decision:** `content` supports HTML. The renderer handles both plain text and rich content.

---

## 11. Relations for structure

The containment hierarchy uses `contains` relations:
- `hamlet` → `hamlet_title-page`
- `hamlet` → `hamlet_about-the-ebook`
- `hamlet` → `hamlet_dramatis-personae`
- `hamlet` → `hamlet_act-i` → `scene_14` → `seg_16`, `seg_18`, ...
- `hamlet` → `hamlet_end-matter` → `hamlet_end-matter_transcribers-notes`, `hamlet_end-matter_license`

The `next` chain links containers in reading order. Segments within a scene are ordered by `next` relations between them.

**Decision:** The `contains` chain encodes the full hierarchy. `next` encodes reading order. Relations are the authoritative source of structure — IDs are a human-readable reflection.

---

## 12. Deleting entities requires relation repair

When `seg_8` (a stray stage-direction) was deleted, three relations were removed:
- `hamlet → seg_8` (contains)
- `dramatis_5 → seg_8` (next)
- `seg_8 → act_11` (next)

The gap was repaired with a new `next`: `dramatis_5 → act_11`.

**Decision:** Entity deletion must cascade to all relations referencing it, and the `next` chain must be repaired. This is a manual process for now (future: app-level delete with relation repair).

---

## 13. Renaming propagates through relations

When entities were renamed (e.g., `act_11` → `hamlet_act-i`, `dramatis_5` → `hamlet_dramatis-personae`), all occurrences across ALL relations' `source` and `target` fields were updated. **38 relation references** were updated for 6 renamed entities.

**Decision:** Entity rename is a bulk find-and-replace across the entire graph. Must update every relation that references the old ID.

---

## 14. `metadata.type` drives rendering

The renderer determines display based on `metadata.type` (or `metadata.character`), not `kind` or `title`:

| `metadata.type` | Display |
|---|---|
| `work` | Root heading |
| `act` | Large section heading |
| `scene` | Scene heading |
| `stage-direction` | Italic text |
| `title-page` | Rich HTML (h1, p) |
| `front-matter` | Block text |
| `dramatis-personae` | Character list |
| `end-matter` | Footer content |

When `metadata.character` is present (any `type`), the renderer shows the character label above the content.

**Decision:** `metadata.type` is the single source for rendering behavior. `kind` (`container` vs `segment`) is a structural concern only.

---

## 15. Applied restructurings (hello2/graph.json log)

| Old ID | New ID | Kind | Change |
|---|---|---|---|
| `hamlet--william-shakespeare` | `hamlet` | container | Renamed |
| `seg_1` | `hamlet_title-page` | container | Renamed + content → child segment |
| `seg_3` | `hamlet_about-the-ebook` | container | Renamed + content → child segment |
| `dramatis_5` | `hamlet_dramatis-personae` | container | Renamed + content → child segment |
| `act_11` | `hamlet_act-i` | container | Renamed |
| `act_869` | `hamlet_act-ii` | container | Renamed |
| `act_1541` | `hamlet_act-iii` | container | Renamed |
| `act_2442` | `hamlet_act-iv` | container | Renamed |
| `act_3124` | `hamlet_act-v` | container | Renamed |
| `seg_4012` | `hamlet_end-matter_transcribers-notes` | container | Moved under end-matter + content → child |
| `seg_4015` | `hamlet_end-matter_license` | container | Moved under end-matter + content → child |
| — | `hamlet_end-matter` | container | Created (end-matter wrapper) |
| `seg_8` | (deleted) | — | Stray artifact, removed with relation repair |
| `seg_*` (x1132) | (same) | segment | Title removed, CHARACTER.\n prefix stripped |

---

## Open questions (still need to settle)

| # | Question | Status |
|---|----------|--------|
| A | Should containers ever have `content`? | **RESOLVED**: No. Content lives in child segments. |
| B | What's the correct character prefix format in rendered text? | TBD — renderer PRD |
| C | How does the import script determine segment boundaries for speeches? | TBD — hamlet import PRD |
| D | Should `author` be a dedicated field or a relation? | TBD — model PRD |
| E | What entity `kind` should characters have? | TBD |
| F | How are character speech labels rendered (uppercase, styled, etc.)? | TBD — renderer PRD |
