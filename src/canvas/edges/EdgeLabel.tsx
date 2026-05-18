import { useCallback, useRef, useState, useEffect, useMemo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react"
import { useGraphStore } from "../../store/useGraphStore"
import { Input } from "@/components/ui/input"

function EdgeLabel({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
}: EdgeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(typeof label === "string" ? label : "")
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  })

  const relations = useGraphStore((s) => s.relations)
  const relationTypes = useMemo(
    () => [...new Set(relations.map((r) => r.type))].sort(),
    [relations],
  )

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commit = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== label) {
      useGraphStore.getState().updateRelation(id, { type: trimmed })
    }
    setIsEditing(false)
    setShowDropdown(false)
  }, [value, label, id])

  const cancel = useCallback(() => {
    setValue(typeof label === "string" ? label : "")
    setIsEditing(false)
    setShowDropdown(false)
  }, [label])

  const handleDoubleClick = useCallback(() => {
    setValue(typeof label === "string" ? label : "")
    setIsEditing(true)
    setShowDropdown(true)
  }, [label])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commit()
      if (e.key === "Escape") cancel()
    },
    [commit, cancel],
  )

  const selectType = useCallback(
    (type: string) => {
      useGraphStore.getState().updateRelation(id, { type })
      setIsEditing(false)
      setShowDropdown(false)
    },
    [id],
  )

  if (isEditing) {
    return (
      <>
        <BaseEdge id={id} path={edgePath} />
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div className="relative">
              <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(commit, 150)}
                className="h-7 w-40 text-xs"
              />
              {showDropdown && relationTypes.length > 0 && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-1 text-xs shadow-md">
                  {relationTypes.map((type) => (
                    <div
                      key={type}
                      className="cursor-pointer rounded-sm px-2 py-1 hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectType(type)
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    )
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            cursor: "pointer",
          }}
          className="react-flow__edge-label nodrag nopan"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default EdgeLabel
