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
 *   country--united-kingdom   state--england   county--warwickshire   city--stratford-upon-avon
 *
 * Person entities use a name-based slug.
 *
 *   william-shakespeare   lygia-fagundes-telles
 *
 * Book entities use `{title-slug}--{author-slug}`.
 *
 *   hamlet--william-shakespeare   ciranda-de-pedra--lygia-fagundes-telles
 */

// ---------------------------------------------------------------------------
// Author entity
// ---------------------------------------------------------------------------

/**
 * Author — a person who created works.
 *
 * Represented as a `container` node.  The `content` field holds the
 * display name (which may differ from the entity id, e.g. "William
 * Shakespeare" vs. `william-shakespeare`).
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
 *   "gender" → creates a `william-shakespeare --gender--> gender--male` edge
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
 *   william-shakespeare ── city ──▶ city--stratford-upon-avon
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

export type { AuthorEntity, AuthorMetadata }
export { AUTHOR_EDGE_FIELDS }
