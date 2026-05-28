import { CollapsibleSection } from "./CollapsibleSection"
import { Switch } from "@/components/ui/switch"

const FEATURE_FLAG_LABELS: Record<string, string> = {
  dragToNest: "Drag to Nest",
  viewLogger: "ViewLogger",
  minimap: "MiniMap",
}

export default function FeatureFlagsSection({
  flags,
  onToggle,
}: {
  flags: Record<string, boolean>
  onToggle: (key: string, value: boolean) => void
}) {
  const entries = Object.entries(flags)

  return (
    <CollapsibleSection title="Experimental" defaultOpen>
      <div className="flex flex-col gap-1 pt-1">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1">No feature flags available</p>
        ) : (
          entries.map(([key, value]) => (
            <Switch
              key={key}
              label={FEATURE_FLAG_LABELS[key] ?? key}
              checked={value}
              onCheckedChange={(v) => onToggle(key, v)}
              className="rounded-md px-2 py-1.5 hover:bg-sidebar-accent cursor-pointer"
            />
          ))
        )}
      </div>
    </CollapsibleSection>
  )
}
