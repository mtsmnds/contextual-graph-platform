import { memo, useState, useCallback, useRef, useEffect } from "react"
import { type Node, type NodeProps, Position, NodeResizeControl, ResizeControlVariant, useNodeId } from "@xyflow/react"
import { useGraphStore } from "@/store/useGraphStore"
import { isEdgeKey, writeEdgeValue } from "@/engine/edge-metadata"
import type { EntityKind } from "@/types/graph"

type MetadataNodeData = {
  entityId: string
}

type MetadataNodeType = Node<MetadataNodeData, "metadata">

type MetadataEntry = { key: string; value: string }

function MetadataNode({ data }: NodeProps<MetadataNodeType>) {
  const nodeId = useNodeId()
  const entity = useGraphStore((s) => s.entities.find((e) => e.id === data.entityId))
  const updateEntity = useGraphStore((s) => s.updateEntity)
  const addEntity = useGraphStore((s) => s.addEntity)
  const addRelation = useGraphStore((s) => s.addRelation)
  const storeEntities = useGraphStore((s) => s.entities)
  const storeRelations = useGraphStore((s) => s.relations)

  const [contentValue, setContentValue] = useState(entity?.content ?? "")
  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>(() => {
    if (!entity) return []
    return Object.entries(entity.metadata).map(([k, v]) => ({ key: k, value: String(v ?? "") }))
  })
  const entryKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (entity) {
      setContentValue(entity.content)
      setMetadataEntries(
        Object.entries(entity.metadata).map(([k, v]) => ({ key: k, value: String(v ?? "") })),
      )
    }
  }, [entity?.id])

  const handleContentCommit = useCallback(() => {
    if (!entity) return
    updateEntity(data.entityId, { content: contentValue })
  }, [entity, data.entityId, contentValue, updateEntity])

  const handleKindChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!entity) return
      updateEntity(data.entityId, { kind: e.target.value as EntityKind })
    },
    [entity, data.entityId, updateEntity],
  )

  const commitMetadata = useCallback(
    (entries: MetadataEntry[]) => {
      if (!entity) return
      const metadata: Record<string, unknown> = {}
      for (const entry of entries) {
        if (entry.key.trim()) {
          metadata[entry.key.trim()] = entry.value
        }
      }
      updateEntity(data.entityId, { metadata })

      for (const entry of entries) {
        if (!entry.key.trim() || !entry.value.trim()) continue
        const key = entry.key.trim()
        if (isEdgeKey(key)) {
          writeEdgeValue(data.entityId, key, entry.value, {
            entities: storeEntities,
            relations: storeRelations,
            addEntity,
            addRelation,
          })
        }
      }
    },
    [entity, data.entityId, updateEntity, addEntity, addRelation, storeEntities, storeRelations],
  )

  const handleEntryKeyBlur = useCallback(
    (_index: number) => {
      entryKeyRef.current = null
      commitMetadata(metadataEntries)
    },
    [metadataEntries, commitMetadata],
  )

  const handleEntryValueBlur = useCallback(
    (_index: number) => {
      commitMetadata(metadataEntries)
    },
    [metadataEntries, commitMetadata],
  )

  const handleEntryChange = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setMetadataEntries((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: val }
        return next
      })
    },
    [],
  )

  const handleAddEntry = useCallback(() => {
    setMetadataEntries((prev) => [...prev, { key: "", value: "" }])
  }, [])

  const handleDeleteEntry = useCallback(
    (index: number) => {
      setMetadataEntries((prev) => {
        const next = prev.filter((_, i) => i !== index)
        commitMetadata(next)
        return next
      })
    },
    [commitMetadata],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Enter" && entryKeyRef.current === null) {
        e.preventDefault()
        entryKeyRef.current = index.toString()
        setMetadataEntries((prev) => {
          commitMetadata(prev)
          return prev
        })
      }
    },
    [commitMetadata],
  )

  if (!entity) return null

  return (
    <>
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Left}
        minWidth={220}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Right}
        minWidth={220}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Top}
        minHeight={120}
      />
      <NodeResizeControl
        nodeId={nodeId ?? undefined}
        variant={ResizeControlVariant.Line}
        position={Position.Bottom}
        minHeight={120}
      />
      <div className="metadata-node bg-card text-card-foreground rounded-md border border-dashed border-muted-foreground/30 w-full">
        <header className="px-3 py-2 border-b border-dashed border-muted-foreground/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Metadata
          </span>
        </header>
        <div className="px-3 py-2 space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Content
            </label>
            <textarea
              className="nodrag nowheel nopan w-full resize-none rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={contentValue}
              onChange={(e) => setContentValue(e.target.value)}
              onBlur={handleContentCommit}
              onKeyDown={(e) => { if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur() }}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Kind
            </label>
            <select
              className="nodrag nowheel nopan w-full rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={entity.kind}
              onChange={handleKindChange}
            >
              <option value="segment">segment</option>
              <option value="container">container</option>
              <option value="annotation">annotation</option>
              <option value="concept">concept</option>
              <option value="summary">summary</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Metadata
            </label>
            <div className="space-y-1">
              {metadataEntries.map((entry, i) => (
                <div key={i} className="flex gap-1 items-center">
                  <input
                    className="nodrag nowheel nopan w-[35%] rounded border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    value={entry.key}
                    onChange={(e) => handleEntryChange(i, "key", e.target.value)}
                    onBlur={() => handleEntryKeyBlur(i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    placeholder="key"
                  />
                  <input
                    className="nodrag nowheel nopan flex-1 rounded border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    value={entry.value}
                    onChange={(e) => handleEntryChange(i, "value", e.target.value)}
                    onBlur={() => handleEntryValueBlur(i)}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                    placeholder="value"
                  />
                  <button
                    className="nodrag nowheel nopan flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => handleDeleteEntry(i)}
                    aria-label="Delete entry"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M2 2l6 6M8 2l-6 6" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                className="nodrag nowheel nopan w-full rounded border border-dashed border-muted-foreground/30 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
                onClick={handleAddEntry}
              >
                + Add entry
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              ID
            </label>
            <div className="font-mono text-[10px] text-muted-foreground/60 truncate select-all px-2 py-1 rounded bg-muted/50">
              {entity.id}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(MetadataNode)
