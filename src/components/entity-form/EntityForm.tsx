import { useState, useCallback, useMemo } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/store/useGraphStore"
import { RelationsSection } from "./RelationsSection"
import { EntityTypeField } from "./EntityTypeField"
import { ContentField } from "./ContentField"
import { MetadataFields } from "./MetadataFields"
import type { RelationRow } from "./RelationEditor"
import type { EntityType, Entity, Relation } from "@/types/graph"

function getSortedContainsEdges(
  state: { entities: Entity[]; relations: Relation[] },
  containerId: string,
) {
  return state.relations
    .filter((r) => r.source === containerId && r.type === "contains")
    .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder))
}

function resolvePosition(
  containerId: string,
  childId: string,
  position: "beginning" | "end" | "after",
  siblingId?: string,
) {
  const store = useGraphStore.getState()
  if (position === "end") {
    store.appendChild(containerId, childId)
    return
  }
  const edges = getSortedContainsEdges(store, containerId)
  if (edges.length === 0) {
    store.appendChild(containerId, childId)
    return
  }
  if (position === "beginning") {
    store.insertChild(containerId, childId, null, edges[0].sortOrder)
    return
  }
  const idx = edges.findIndex((e) => e.target === siblingId)
  if (idx === -1) {
    store.appendChild(containerId, childId)
    return
  }
  const prevKey = edges[idx].sortOrder
  const nextKey = idx < edges.length - 1 ? edges[idx + 1].sortOrder : null
  store.insertChild(containerId, childId, prevKey, nextKey)
}

export type EntityFormProps = {
  onSubmit?: (entityId: string) => void
  defaultParentId?: string
}

export function EntityForm({ onSubmit, defaultParentId }: EntityFormProps) {
  const [type, setType] = useState("")
  const [content, setContent] = useState("")
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})
  const [relations, setRelations] = useState<RelationRow[]>(() =>
    defaultParentId
      ? [
          {
            id: crypto.randomUUID(),
            type: "contains",
            targetId: defaultParentId,
            kind: "contains",
            position: "end",
          } as RelationRow,
        ]
      : [],
  )
  const [submitted, setSubmitted] = useState(false)

  const canSubmit = useMemo(() => type.trim().length > 0, [type])

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    setSubmitted(true)
    const store = useGraphStore.getState()
    const id = store.addEntity(type.trim() as EntityType, { content, metadata })
    for (const rel of relations) {
      if (rel.kind === "contains" && rel.targetId) {
        resolvePosition(rel.targetId, id, rel.position, (rel as any).siblingId)
      } else if (rel.type && rel.targetId) {
        store.addRelation(id, rel.targetId, rel.type)
      }
    }
    onSubmit?.(id)
  }, [type, content, metadata, relations, canSubmit, onSubmit])

  if (submitted) return null

  return (
    <div className="space-y-4">
      <EntityTypeField value={type} onChange={setType} />
      <ContentField value={content} onChange={setContent} />
      <MetadataFields entityType={type} metadata={metadata} onChange={setMetadata} />
      <RelationsSection relations={relations} onChange={setRelations} />
      <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
        <PlusIcon className="mr-1.5 size-4" />
        Create Entity
      </Button>
    </div>
  )
}
