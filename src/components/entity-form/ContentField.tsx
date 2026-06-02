import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ContentField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>Content</Label>
      <Textarea
        placeholder="Entity content..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
