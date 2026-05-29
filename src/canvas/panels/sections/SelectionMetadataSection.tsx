import { useEffect, useState, useCallback } from "react"
import type { Entity, EntityType } from "@/types/graph"
import { CollapsibleSection } from "./CollapsibleSection"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowsClockwise, Plus, Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

function formatTimestamp(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(ts)
}

function GhostInput({
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
}: {
  value: string
  onChange?: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  type?: string
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className="h-7 border-transparent bg-transparent px-1.5 text-xs hover:border-muted focus:border-ring focus:ring-0"
    />
  )
}

export default function SelectionMetadataSection({
  entity,
  onUpdateEntity,
}: {
  entity: Entity | null
  onUpdateEntity: (id: string, data: Partial<Entity>) => void
}) {
  const [idValue, setIdValue] = useState("")
  const [xValue, setXValue] = useState("0")
  const [yValue, setYValue] = useState("0")
  const [wValue, setWValue] = useState("")
  const [hValue, setHValue] = useState("")
  const [metadataEntries, setMetadataEntries] = useState<Array<{ key: string; value: string }>>([])

  useEffect(() => {
    if (!entity) return
    setIdValue(entity.id)
    setXValue(String(entity.canvasData.x ?? 0))
    setYValue(String(entity.canvasData.y ?? 0))
    setWValue(entity.canvasData.width != null ? String(entity.canvasData.width) : "")
    setHValue(entity.canvasData.height != null ? String(entity.canvasData.height) : "")
    setMetadataEntries(
      Object.entries(entity.metadata).map(([k, v]) => ({ key: k, value: String(v ?? "") })),
    )
  }, [entity])

  const snap16 = useCallback((val: string) => {
    const n = parseFloat(val)
    return isNaN(n) ? 0 : Math.ceil(n / 16) * 16
  }, [])

  const idDirty = entity ? idValue !== entity.id : false

  const commitId = useCallback(() => {
    if (entity && idValue !== entity.id) {
      onUpdateEntity(entity.id, { id: idValue })
    }
  }, [idValue, entity, onUpdateEntity])

  const commitCoord = useCallback(
    (field: "x" | "y") => {
      if (!entity) return
      const val = field === "x" ? snap16(xValue) : snap16(yValue)
      if (field === "x") setXValue(String(val))
      else setYValue(String(val))
      onUpdateEntity(entity.id, {
        canvasData: { ...entity.canvasData, [field]: val },
      })
    },
    [entity, xValue, yValue, snap16, onUpdateEntity],
  )

  const commitDim = useCallback(
    (field: "width" | "height") => {
      if (!entity) return
      const raw = field === "width" ? wValue : hValue
      const val = raw ? snap16(raw) : undefined
      if (field === "width") setWValue(val != null ? String(val) : "")
      else setHValue(val != null ? String(val) : "")
      onUpdateEntity(entity.id, {
        canvasData: { ...entity.canvasData, [field]: val },
      })
    },
    [entity, wValue, hValue, snap16, onUpdateEntity],
  )

  const updateMetadataEntry = useCallback((index: number, field: "key" | "value", val: string) => {
    setMetadataEntries((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })
  }, [])

  const removeMetadataEntry = useCallback((index: number) => {
    setMetadataEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addMetadataEntry = useCallback(() => {
    setMetadataEntries((prev) => [...prev, { key: "", value: "" }])
  }, [])

  const commitMetadata = useCallback(() => {
    if (!entity) return
    const metadata: Record<string, unknown> = {}
    for (const entry of metadataEntries) {
      if (entry.key) metadata[entry.key] = entry.value
    }
    onUpdateEntity(entity.id, { metadata })
  }, [entity, metadataEntries, onUpdateEntity])

  return (
    <CollapsibleSection title="Node Properties" defaultOpen>
      {!entity ? (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
          Click a node to inspect its properties
        </p>
      ) : (
        <div className="flex flex-col gap-1 pt-1">
          {/* Identity */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2">
              Identity
            </span>
            <PropertyRow label="id">
              <div className="flex items-center gap-1">
                <div className="flex-1">
                  <GhostInput
                    value={idValue}
                    onChange={setIdValue}
                    onBlur={commitId}
                    placeholder="entity id"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Refresh edges"
                  title="Update all edges referencing the old ID"
                  disabled={!idDirty}
                  onClick={commitId}
                >
                  <ArrowsClockwise />
                </Button>
              </div>
            </PropertyRow>
            <PropertyRow label="type">
              <Select
                value={entity.type}
                onValueChange={(value) => onUpdateEntity(entity.id, { type: value as EntityType })}
              >
                <SelectTrigger size="sm" className="h-7 text-xs px-1.5 border-transparent hover:border-muted focus:border-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segment">segment</SelectItem>
                  <SelectItem value="container">container</SelectItem>
                  <SelectItem value="annotation">annotation</SelectItem>
                  <SelectItem value="concept">concept</SelectItem>
                  <SelectItem value="summary">summary</SelectItem>
                </SelectContent>
              </Select>
            </PropertyRow>
            <PropertyRow label="parent">
              <span className="text-xs text-muted-foreground truncate">
                {entity.parentId || "—"}
              </span>
            </PropertyRow>
          </div>

          <Separator className="my-1" />

          {/* Timestamps */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2">
              Timestamps
            </span>
            <PropertyRow label="created">
              <span className="text-xs">{formatTimestamp(entity.createdAt)}</span>
            </PropertyRow>
            <PropertyRow label="updated">
              <span className="text-xs">{formatTimestamp(entity.updatedAt)}</span>
            </PropertyRow>
          </div>

          <Separator className="my-1" />

          {/* Canvas */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2">
              Canvas
            </span>
            <PropertyRow label="x">
              <GhostInput value={xValue} onChange={setXValue} onBlur={() => commitCoord("x")} type="number" />
            </PropertyRow>
            <PropertyRow label="y">
              <GhostInput value={yValue} onChange={setYValue} onBlur={() => commitCoord("y")} type="number" />
            </PropertyRow>
            <PropertyRow label="width">
              <GhostInput value={wValue} onChange={setWValue} onBlur={() => commitDim("width")} type="number" placeholder="auto" />
            </PropertyRow>
            <PropertyRow label="height">
              <GhostInput value={hValue} onChange={setHValue} onBlur={() => commitDim("height")} type="number" placeholder="auto" />
            </PropertyRow>
          </div>

          <Separator className="my-1" />

          {/* Metadata */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2">
              Metadata
            </span>
            {metadataEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-1">No metadata entries</p>
            ) : (
              metadataEntries.map((entry, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1 items-center px-2">
                  <GhostInput
                    value={entry.key}
                    onChange={(v) => updateMetadataEntry(i, "key", v)}
                    placeholder="key"
                  />
                  <GhostInput
                    value={entry.value}
                    onChange={(v) => updateMetadataEntry(i, "value", v)}
                    placeholder="value"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove metadata entry"
                    onClick={() => removeMetadataEntry(i)}
                  >
                    <Trash />
                  </Button>
                </div>
              ))
            )}
            <div className="flex items-center gap-1 px-2 pt-0.5">
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-xs text-muted-foreground"
                onClick={addMetadataEntry}
              >
                <Plus />
                Add entry
              </Button>
              {metadataEntries.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-xs text-muted-foreground"
                  onClick={commitMetadata}
                >
                  Save metadata
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}

function PropertyRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 items-center px-2 min-h-8">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      {children}
    </div>
  )
}
