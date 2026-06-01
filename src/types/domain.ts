import type { Entity, EntityType } from "./graph"

// ---------------------------------------------------------------------------
// ID conventions
// ---------------------------------------------------------------------------

/**
 * Classification concepts use `{key}--{value}`.
 *
 *   type--author   gender--male   global--north
 *
 * Geography concepts use `{level}--{name}`.
 *
 *   country--united-kingdom   state--england   city--stratford-upon-avon
 *
 * Person entities use a name-based slug.  Familiar figures may be
 * shortened — there is no loss of information for the user:
 *
 *   shakespeare             (instead of william-shakespeare)
 *   lygia-fagundes-telles   (full name — less well known)
 *
 * Book entities use `{title-slug}--{author-slug}`.  Both halves may
 * be shortened for brevity.  The `--` separator is the only invariant:
 *
 *   hamlet--shakespeare     (shortened title + shortened author)
 *   midsummer--shakespeare
 *   ciranda-de-pedra--lygia-fagundes-telles  (full — less well known)
 *
 * Book top-level containers use `{book-id}--{descriptive-name}`:
 *
 *   hamlet--shakespeare--synopsis
 *   hamlet--shakespeare--content
 *   hamlet--shakespeare--notes
 *
 * Book structural levels use short codes directly under the book
 * prefix.  The hierarchy lives in `contains` edges, not the ID:
 *
 *   Structure           Code    Example ID
 *   ───────────────────────────────────────────────────
 *   Act 1               a1      hamlet--shakespeare--a1
 *   Act 1, Scene 1      a1s1    hamlet--shakespeare--a1s1
 *   Part 2, Chapter 3   p2c3    some-novel--some-author--p2c3
 *   Chapter 12          c12     some-novel--some-author--c12
 *
 * Segments use three-digit sequential numbers under a parent,
 * with no prefix.  The entity `type: "segment"` already identifies
 * what it is:
 *
 *   hamlet--shakespeare--a1s1-001
 *   hamlet--shakespeare--a1s1-002
 *
 * Three digits → up to 999 per container.  Hamlet's longest scene
 * has ~180 speeches, well within range.
 */

// ---------------------------------------------------------------------------
// Sort order convention
// ---------------------------------------------------------------------------

/**
 * Children within a container are ordered by the `sortOrder` field on
 * `contains` edges. The field holds a fractional-indexing key generated
 * by the `fractional-indexing-jittered` package.
 *
 * Key properties:
 *
 *   - Keys are strings that sort lexicographically in the desired order.
 *   - `generateKeyBetween(a, b)` produces a key strictly between two
 *     neighbours. Either argument can be null (before first / after last).
 *   - `generateNKeysBetween(a, b, n)` produces n evenly-spaced keys.
 *   - Jitter (random suffix) prevents collisions during concurrent edits.
 *
 * Rules:
 *
 *   1. **Append** — `generateKeyBetween(lastSiblingKey, null)`
 *   2. **Insert** — `generateKeyBetween(prevKey, nextKey)`
 *   3. **Move** — update `sortOrder` on the existing `contains` edge
 *      (preserves `createdAt` and other edge metadata)
 *   4. **Delete** — no reindex; remaining siblings keep their keys
 *   5. **Batch import** — `generateNKeysBetween(null, null, count)`
 *
 * Sort order is **global within a container**: `contains` edges for all
 * entity types (containers, segments, annotations, concepts, summaries)
 * interleave under the same parent. There is no type-based partitioning.
 *
 * Store actions that manage sort order:
 *   - `appendChild(containerId, childId)`
 *   - `insertChild(containerId, childId, prevKey, nextKey)`
 *   - `moveChild(containerId, childId, newPrevKey, newNextKey)`
 *   - `backfillContainerOrder(containerId)`
 */

// ---------------------------------------------------------------------------
// Author entity
// ---------------------------------------------------------------------------

/**
 * Author — a person who created works.
 *
 * Represented as a `container` node.  The `content` field holds the
 * display name (which may differ from the entity id, e.g. "William
 * Shakespeare" vs. `shakespeare`).
 *
 * Classification attributes (type, gender, global) are **not** stored as
 * metadata.  They are encoded as edges to concept nodes so that graph
 * traversal can answer questions like "show me all male authors" or
 * "show me all global-south authors".
 */
type AuthorEntity = Entity & {
  type: "container"
  content: string // display name, e.g. "William Shakespeare"
  metadata: AuthorMetadata
}

type AuthorMetadata = {
  /** Display name — may differ from the entity id */
  name: string

  /**
   * Date fields are metadata only (not edges).
   * We do not need to graph every day inside every month inside
   * every year, so birth / death / creation dates live as strings
   * on the entity itself.
   */
  birth_date?: string // YYYY-MM-DD
  death_date?: string // YYYY-MM-DD
  date_created?: string // YYYY-MM-DD — when the author was first imported
}

// ---------------------------------------------------------------------------
// Fields that become edges
// ---------------------------------------------------------------------------

/**
 * Registry of author fields that map to edges instead of metadata.
 *
 * Each entry defines:
 *  - the relation type used on the edge
 *  - the target entity type (always "concept" for facet nodes)
 *  - the concept id prefix that names the target node
 *
 * Example:
 *   "gender" → creates a `shakespeare --gender--> gender--male` edge
 *
 * The edge is always **source = author, target = concept node**.
 */
const AUTHOR_EDGE_FIELDS: Record<
  string,
  {
    /** Relation type used on the edge */
    relationType: string
    /** Target entity type */
    targetType: EntityType
    /** ID prefix for the concept node, so the id is `{prefix}{value}` */
    conceptPrefix: string
  }
> = {
  /** The domain classification of the author (always "author" for now) */
  type: {
    relationType: "type",
    targetType: "concept",
    conceptPrefix: "type--",
  },
  /** Gender → "male" | "female" | … */
  gender: {
    relationType: "gender",
    targetType: "concept",
    conceptPrefix: "gender--",
  },
  /** Global classification → "north" | "south" */
  global: {
    relationType: "global",
    targetType: "concept",
    conceptPrefix: "global--",
  },
}

// ---------------------------------------------------------------------------
// Book entity
// ---------------------------------------------------------------------------

/**
 * Book — a published work.
 *
 * Represented as a `container` node.  The `content` field holds the
 * display title (e.g. "Hamlet").
 *
 * Classification attributes (type, year, language, format, setting,
 * author) are **not** stored as metadata.  They are encoded as edges
 * so that graph traversal can answer questions like "show me all
 * books from the 1620s" or "show me all french books".
 */
type BookEntity = Entity & {
  type: "container"
  content: string // display title, e.g. "Hamlet"
  metadata: BookMetadata
}

type BookMetadata = {
  /** Page count */
  pages?: number

  /**
   * Reading history — tracked as metadata for now, but
   * likely to become its own domain concept later.
   * Each entry's date_start / date_finish are dates
   * (treated the same as birth_date / death_date —
   * strings, not edges).  The language field inside
   * a reading_history entry can differ from the book's
   * language (reader reads a translation).
   */
  reading_history?: ReadingHistoryEntry[]

  /** When the book was first imported */
  date_created?: string
}

type ReadingHistoryEntry = {
  status: "finished" | "reading" | "next" | string
  media: string // "ebook" | "paperback" | …
  date_start: string // YYYY-MM-DD
  date_finish: string // YYYY-MM-DD
  language: string // language the reader read in
}

// ---------------------------------------------------------------------------
// Fields that become edges — books
// ---------------------------------------------------------------------------

/**
 * Registry of book fields that map to edges instead of metadata.
 *
 * The edge is always **source = book, target = concept node**,
 * except `author` which targets the author container directly
 * and `setting` which targets a geography leaf node.
 */
const BOOK_EDGE_FIELDS: Record<
  string,
  {
    relationType: string
    targetType: EntityType
    conceptPrefix: string
  }
> = {
  type: {
    relationType: "type",
    targetType: "concept",
    conceptPrefix: "type--",
  },
  author: {
    relationType: "author",
    targetType: "container",
    conceptPrefix: "",
  },
  year: {
    relationType: "year",
    targetType: "concept",
    conceptPrefix: "year--",
  },
  language: {
    relationType: "language",
    targetType: "concept",
    conceptPrefix: "language--",
  },
  format: {
    relationType: "format",
    targetType: "concept",
    conceptPrefix: "format--",
  },
  setting: {
    relationType: "setting",
    targetType: "concept",
    conceptPrefix: "",
  },
}

// ---------------------------------------------------------------------------
// Geography convention
// ---------------------------------------------------------------------------

/**
 * Geography is modeled as concept nodes connected by `contains` edges.
 * There is **no fixed depth** — the chain can have any number of levels.
 *
 * The kind of geography (country, state, county, city, …) is stored as
 * metadata on the node itself, not as an edge.  We don't need graph
 * traversal for "show me all countries":
 *
 *   metadata: { geoType: "country" }
 *   metadata: { geoType: "state" }
 *   metadata: { geoType: "county" }
 *   metadata: { geoType: "city" }
 *
 * The hierarchy is defined by `contains` relations alone:
 *
 *   country--united-kingdom
 *     └── contains ──▶ state--england
 *                        └── contains ──▶ county--warwickshire
 *                                           └── contains ──▶ city--stratford-upon-avon
 *
 * An entity connects only to the smallest relevant geography node:
 *
 *   shakespeare ── city ──▶ city--stratford-upon-avon
 *
 * Queries like "all authors from England" require recursive traversal
 * from the ancestor node, following `contains` edges down to leaf
 * cities, then collecting entities connected to those cities.
 *
 * When geography is collapsed in a viz, edge propagation carries
 * the `city` edge from the hidden leaf up to the nearest visible
 * ancestor so the connection is not lost.
 *
 * New levels are added by creating a concept node with
 * `metadata.geoType` and inserting it anywhere in the `contains`
 * chain.
 */

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type { AuthorEntity, AuthorMetadata, BookEntity, BookMetadata, ReadingHistoryEntry }
export { AUTHOR_EDGE_FIELDS, BOOK_EDGE_FIELDS }
