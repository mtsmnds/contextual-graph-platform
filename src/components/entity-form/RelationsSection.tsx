import { useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RelationEditor, type RelationRow } from "./RelationEditor"

function createEmptyRow(): RelationRow {
  return {
    id: crypto.randomUUID(),
    type: "",
    targetId: "",
    kind: "other",
  }
}

export function RelationsSection({
  relations,
  onChange,
}: {
  relations: RelationRow[]
  onChange: (relations: RelationRow[]) => void
}) {
  const addRow = useCallback(() => {
    const row = createEmptyRow()
    onChange([...relations, row])
  }, [relations, onChange])

  const updateRow = useCallback(
    (index: number, row: RelationRow) => {
      const next = [...relations]
      next[index] = row
      onChange(next)
    },
    [relations, onChange],
  )

  const removeRow = useCallback(
    (index: number) => {
      onChange(relations.filter((_, i) => i !== index))
    },
    [relations, onChange],
  )

  if (relations.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Relations
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={addRow}
        >
          <PlusIcon className="mr-1.5 size-3" />
          Add relation
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Relations
        </Label>
        <Button variant="ghost" size="icon-xs" onClick={addRow} aria-label="Add relation">
          <PlusIcon className="size-3" />
        </Button>
      </div>
      <div className="space-y-2">
        {relations.map((row, i) => (
          <RelationEditor
            key={row.id}
            value={row}
            onChange={(r) => updateRow(i, r)}
            onRemove={() => removeRow(i)}
            showRemove={relations.length > 1}
          />
        ))}
      </div>
    </div>
  )
}
