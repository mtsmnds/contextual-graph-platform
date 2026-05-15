# PRD0010-1 — Minimal Entity Model Implementation

> **Completion note:** Implemented. Created `src/engine/ids.ts` (slugify, generateEntityId, collision handling). Wired into store: `addEntity` auto-generates IDs, enforces no-title-on-segments and no-content-on-containers. `updateEntity` propagrades ID changes through relations. Added HTML content support in the reading viewport via `ContentHtml` component.

## Scope

**Implement now:**
- Part 2 rule: IDs are assigned once and never recalculated
- Part 1 rule 1: Segments never have `title` field
- Part 1 rule 2: Containers never have `content`
- Part 1 rule 3: Entity deletion cascades to relations (already done)
- Part 1 rule 4: Entity rename propagates through all relations
- Part 1 rule 6: Content supports HTML rendering
- ID format: `[parent-id]_seg-[counter]` for segments, `[parent-id]_[slug]` for sub-containers
- Slug rules: lowercase, whitespace→`-`, strip punctuation, accent→ascii
- Counter scheme: 4-digit zero-padded for segments, 2-digit for numbered containers
- Zero-padding: keep

**Postponed (stays in PRD0010):**
- Rule 5: `metadata.type` drives rendering — evolve later
- Hamlet data migration to new IDs
- Other items not listed above

## Files

| File | Action |
|------|--------|
| `src/engine/ids.ts` | Create — `slugify(title)`, `generateEntityId(parentId, kind, title, siblingCount)` |
| `src/store/useGraphStore.ts` | Wire `generateEntityId` into `addEntity`; enforce no-title/no-content; propagate rename in `updateEntity` |
| `src/renderers/ReadingViewport.tsx` | Render HTML content when content contains `<` |

## Implementation

### `src/engine/ids.ts`
- `slugify(title)`: lowercase, whitespace→`-`, strip punctuation, accent→ascii, collapse `-`, trim
- `generateEntityId(parentId, kind, title, siblingCount)`: root→slug, container→`parent_slug`, segment→`parent_seg-XXXX`
- Collision: append `-1`, `-2` if ID already exists

### Store changes
- `addEntity(parentId, kind, data)`: auto-generate ID via `generateEntityId`; strip `title` from segments; strip `content` from containers
- `updateEntity(id, data)`: if `data.id` changed, update all relations' `source`/`target`; strip `title` from segments; strip `content` from containers
- `deleteEntity(id)`: already cascades relations (no change needed)

### Reading viewport
- Detect HTML in content (`content.includes('<')`) → `dangerouslySetInnerHTML`
- Otherwise → render as plain text

## Verification

```sh
npx tsc --noEmit
npm run build
```
