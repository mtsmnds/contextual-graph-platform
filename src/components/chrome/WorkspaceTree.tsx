import { useMemo } from "react"
import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import { compareSortOrder } from "../../engine/queries"
import { ContainerCard } from "../ContainerCard"
import { Collapsible, CollapsibleTrigger } from "../ui/collapsible"
import { CaretDown } from "@phosphor-icons/react"
import type { Manifest, Entity, Relation } from "../../types/graph"

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

function manifestKeyLabel(key: string): string {
  const withoutLang = key.includes("-") ? key.substring(key.indexOf("-") + 1) : key
  const ch = withoutLang.match(/^c(\d+)$/)
  if (ch) return `Chapter ${ch[1]}`
  const actScene = withoutLang.match(/^a(\d+)s(\d+)$/)
  if (actScene) return `Act ${actScene[1]}, Scene ${actScene[2]}`
  const part = withoutLang.match(/^p(\d+)c(\d+)$/)
  if (part) return `Part ${part[1]}, Chapter ${part[2]}`
  return key
}

function findBookId(entityId: string, manifest: Manifest | null): string | null {
  if (!manifest) return null
  for (const bookId of Object.keys(manifest.collections)) {
    if (entityId === bookId || entityId.startsWith(bookId + "--")) return bookId
  }
  return null
}

function contentEntityInfo(entityId: string, manifest: Manifest | null): { bookId: string; lang: string } | null {
  if (!manifest) return null
  for (const [bookId, coll] of Object.entries(manifest.collections)) {
    for (const [lang] of Object.entries(coll.content)) {
      if (entityId === `${bookId}--${lang}-content`) return { bookId, lang }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Child entry type
// ---------------------------------------------------------------------------

type TreeEntry = {
  entityId: string
  label: string
  isVirtual: boolean
}

// ---------------------------------------------------------------------------
// TreeItem
// ---------------------------------------------------------------------------

function TreeItem({ entityId, depth }: { entityId: string; depth: number }) {
  const entity = useGraphStore((s) => s.entities.find((e) => e.id === entityId))
  const relations = useGraphStore((s) => s.relations)
  const entities = useGraphStore((s) => s.entities)
  const manifest = useGraphStore((s) => s.manifest)
  const textCollapsed = useChromeStore((s) => s.textCollapsed)
  const toggleTextCollapsed = useChromeStore((s) => s.toggleTextCollapsed)
  const addContainer = useChromeStore((s) => s.addContainer)

  // Only render containers (not segments) in the tree
  if (entity && entity.type !== "container") return null

  const childEntries = useMemo(
    () => buildChildren(entityId, manifest, entities, relations),
    [entityId, manifest, entities, relations],
  )

  const label = entity?.content || entityId
  const isCollapsed = textCollapsed.has(entityId)
  const hasChildren = childEntries.length > 0

  const handleClick = async () => {
    const bookId = findBookId(entityId, manifest)
    if (bookId) {
      await useGraphStore.getState().loadBookContent(bookId)
    }
    addContainer(entityId)
  }

  return (
    <div>
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: depth * 16 }}>
        {hasChildren ? (
          <Collapsible open={!isCollapsed} onOpenChange={() => toggleTextCollapsed(entityId)}>
            <CollapsibleTrigger className="p-0.5 rounded hover:bg-accent cursor-pointer text-muted-foreground transition-transform data-[state=open]:rotate-0 -rotate-90">
              <CaretDown size={12} />
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <span className="w-[22px]" />
        )}
        <button
          className={`cursor-pointer hover:underline text-sm inline truncate text-left ${!entity ? "italic text-muted-foreground" : ""}`}
          onClick={handleClick}
        >
          {label}
        </button>
      </div>
      {hasChildren && !isCollapsed && (
        <div>
          {childEntries.map((entry) => (
            <TreeItem key={entry.entityId} entityId={entry.entityId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Child builder
// ---------------------------------------------------------------------------

function buildChildren(
  entityId: string,
  manifest: Manifest | null,
  entities: Entity[],
  relations: Relation[],
): TreeEntry[] {
  const entries: TreeEntry[] = []
  const storeChildIds = new Set<string>()

  // Real children from store contains edges
  for (const rel of relations) {
    if (rel.type === "contains" && rel.source === entityId) {
      storeChildIds.add(rel.target)
    }
  }
  const sortedStoreChildren = relations
    .filter((r) => r.type === "contains" && r.source === entityId)
    .sort((a, b) => compareSortOrder(a.sortOrder, b.sortOrder))
  for (const rel of sortedStoreChildren) {
    const child = entities.find((e) => e.id === rel.target)
    entries.push({
      entityId: rel.target,
      label: child?.content || rel.target,
      isVirtual: false,
    })
  }

  // Manifest-derived children for book entities
  const collection = manifest?.collections[entityId]
  if (collection) {
    for (const [lang] of Object.entries(collection.content)) {
      const childId = `${entityId}--${lang}-content`
      if (!storeChildIds.has(childId)) {
        entries.push({ entityId: childId, label: `Content (${lang.toUpperCase()})`, isVirtual: true })
      }
    }
    const notesId = `${entityId}--notes`
    if (!storeChildIds.has(notesId)) {
      entries.push({ entityId: notesId, label: "Notes", isVirtual: true })
    }
  }

  // Manifest-derived children for content containers → chapters
  const ci = contentEntityInfo(entityId, manifest)
  if (ci) {
    const bookColl = manifest?.collections[ci.bookId]
    if (bookColl) {
      for (const [key] of Object.entries(bookColl.chapters)) {
        const childId = `${ci.bookId}--${key}`
        if (!storeChildIds.has(childId)) {
          entries.push({ entityId: childId, label: manifestKeyLabel(key), isVirtual: true })
        }
      }
    }
  }

  return entries
}

// ---------------------------------------------------------------------------
// WorkspaceTree (root)
// ---------------------------------------------------------------------------

function WorkspaceTree() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const childIds = new Set(
    relations.filter((r) => r.type === "contains").map((r) => r.target),
  )
  const roots = entities.filter((e) => e.type === "container" && !childIds.has(e.id))

  return (
    <ContainerCard header={<span className="font-semibold text-sm">Workspace</span>}>
      {roots.length === 0 ? (
        <p className="p-3 text-muted-foreground text-sm">No containers found</p>
      ) : (
        <div className="p-2 font-mono text-sm">
          {roots.map((root) => (
            <TreeItem key={root.id} entityId={root.id} depth={0} />
          ))}
        </div>
      )}
    </ContainerCard>
  )
}

export default WorkspaceTree
