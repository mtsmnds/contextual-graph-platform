import { CollapsibleSection } from "./CollapsibleSection"
import type { LayoutOptions } from "@/engine/layout"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const RANKDIR_OPTIONS: Array<{ value: LayoutOptions["rankdir"]; label: string }> = [
  { value: "TB", label: "Top → Bottom" },
  { value: "BT", label: "Bottom → Top" },
  { value: "LR", label: "Left → Right" },
  { value: "RL", label: "Right → Left" },
]

export default function CanvasLayoutSection({
  options,
  onChange,
  onRunLayout,
}: {
  options: LayoutOptions
  onChange: (update: Partial<LayoutOptions>) => void
  onRunLayout: () => void
}) {
  return (
    <CollapsibleSection title="Canvas Layout" defaultOpen>
      <div className="flex flex-col gap-2 pt-2 px-2">
        <FieldRow label="Direction">
          <Select
            value={options.rankdir}
            onValueChange={(value) => onChange({ rankdir: value as LayoutOptions["rankdir"] })}
          >
            <SelectTrigger size="sm" className="h-7 text-xs px-1.5 border-transparent hover:border-muted focus:border-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANKDIR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Node spacing">
          <Input
            type="number"
            min={20}
            max={400}
            value={options.nodesep}
            onChange={(e) => onChange({ nodesep: Number(e.target.value) })}
            className="h-7 text-xs px-1.5 border-transparent hover:border-muted focus:border-ring bg-transparent"
          />
        </FieldRow>

        <FieldRow label="Rank spacing">
          <Input
            type="number"
            min={20}
            max={600}
            value={options.ranksep}
            onChange={(e) => onChange({ ranksep: Number(e.target.value) })}
            className="h-7 text-xs px-1.5 border-transparent hover:border-muted focus:border-ring bg-transparent"
          />
        </FieldRow>

        <FieldRow label="Node width">
          <Input
            type="number"
            min={120}
            max={600}
            value={options.nodeWidth}
            onChange={(e) => onChange({ nodeWidth: Number(e.target.value) })}
            className="h-7 text-xs px-1.5 border-transparent hover:border-muted focus:border-ring bg-transparent"
          />
        </FieldRow>

        <button
          onClick={onRunLayout}
          className="mt-1 w-full rounded-lg border border-input bg-transparent py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
        >
          Run Layout
        </button>
      </div>
    </CollapsibleSection>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 items-center min-h-7">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      {children}
    </div>
  )
}
