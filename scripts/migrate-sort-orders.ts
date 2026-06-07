import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { generateNKeysBetween } from "fractional-indexing-jittered"

const DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const GRAPH_PATH = join(DIR, "..", "hello2", "graph.json")

interface Relation {
  id: string
  source: string
  target: string
  type: string
  sortOrder: string
  metadata: Record<string, unknown>
}

interface GraphSnapshot {
  version: 5
  entities: Array<{ id: string }>
  relations: Relation[]
  canvas: Record<string, unknown>
}

/**
 * Returns true if the relation already has a proper fractional-indexing key
 * (contains base-62 chars beyond 0-9 like aA, aB, or uses the full alphabet).
 */
function isFractionalKey(so: string): boolean {
  // Fractional-indexing uses base-62: 0-9, A-Z, a-z
  // A key like "aA" or "a10" or "Zz" is valid fractional-indexing
  // But "a10" could also be bare numbering. How to distinguish?
  // Fractional-indexing always starts with a lowercase letter for positive keys.
  // Bare "a10" has '1' after 'a'. Fractional "a10" has '1' at position 2 and '0' at position 3.
  // They're actually the same string! So we can't distinguish "a10" as fractional vs bare.
  //
  // Instead: if ALL keys in a container are pure `a\d+` (a followed by digits only),
  // and any has value >= 10, it's bare numbering that needs migration.
  // If any key contains letters (A-Z, a-z excluding the leading 'a'), it's already fractional-indexed.
  return /^[a-z][0-9A-Za-z]+$/.test(so) && /[A-Za-z]/.test(so.slice(1))
}

/**
 * Returns the numeric value for a bare `a\d+` key, or null if not matching.
 */
function parseBareNum(so: string): number | null {
  const m = so.match(/^a(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

function sortKey(so: string): [number, string] {
  const m = so.match(/^a(\d+)$/)
  if (m) return [0, m[1].padStart(10, "0")]
  return [1, so]
}

function migrate() {
  const data: GraphSnapshot = JSON.parse(readFileSync(GRAPH_PATH, "utf-8"))

  const parentGroups: Record<string, Relation[]> = {}
  for (const r of data.relations) {
    if (r.type !== "contains") continue
    if (!parentGroups[r.source]) parentGroups[r.source] = []
    parentGroups[r.source].push(r)
  }

  let updated = 0
  let migrated = 0

  for (const [parent, children] of Object.entries(parentGroups)) {
    if (children.length < 2) continue

    // Analyse current keys
    const allBareNums = children.every((c) => parseBareNum(c.sortOrder) !== null)
    const hasFractional = children.some((c) => isFractionalKey(c.sortOrder))

    // Already using fractional-indexing keys
    if (hasFractional) continue

    // All are bare aN:
    if (allBareNums) {
      const maxNum = Math.max(
        ...children.map((c) => parseBareNum(c.sortOrder)!)
      )
      // If max >= 10, bare numbering breaks lexicographically
      // Also rekey if max is close to 10 (room for insertion)
      if (maxNum < 10) continue
    }

    // Sort children in intended order (numeric for bare aN, then string for others)
    const sorted = [...children].sort((a, b) => {
      const [ka, va] = sortKey(a.sortOrder)
      const [kb, vb] = sortKey(b.sortOrder)
      return ka !== kb ? ka - kb : va.localeCompare(vb)
    })

    const newKeys = generateNKeysBetween(null, null, children.length)

    for (let i = 0; i < sorted.length; i++) {
      sorted[i].sortOrder = newKeys[i]
      updated++
    }
    migrated++
    console.log(
      `  ${parent.split("--").pop()}: ${children.length} items rekeyed`
    )
  }

  writeFileSync(GRAPH_PATH, JSON.stringify(data, null, 2) + "\n")
  console.log(`\nMigrated ${migrated} containers, updated ${updated} sortOrders`)
}

migrate()
