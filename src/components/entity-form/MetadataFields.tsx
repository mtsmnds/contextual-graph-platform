import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MetadataFields({
  entityType,
  metadata,
  onChange,
}: {
  entityType: string
  metadata: Record<string, unknown>
  onChange: (metadata: Record<string, unknown>) => void
}) {
  if (entityType !== "segment") return null

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        Metadata
      </Label>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs font-normal">Line Number</Label>
          <Input
            type="number"
            placeholder="e.g. 42"
            value={(metadata.lineNumber as string) ?? ""}
            onChange={(e) =>
              onChange({ ...metadata, lineNumber: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-normal">Character</Label>
          <Input
            placeholder="e.g. Hamlet"
            value={(metadata.character as string) ?? ""}
            onChange={(e) =>
              onChange({ ...metadata, character: e.target.value || undefined })
            }
          />
        </div>
      </div>
    </div>
  )
}
