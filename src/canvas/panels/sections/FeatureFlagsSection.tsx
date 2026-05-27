import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { CaretDown } from "@phosphor-icons/react"

const FEATURE_FLAG_LABELS: Record<string, string> = {
  dragToNest: "Drag to Nest",
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
    <Collapsible defaultOpen>
      <SidebarGroup>
        <CollapsibleTrigger nativeButton={false} render={<SidebarGroupLabel />}>
          <CaretDown className="size-3 shrink-0" />
          <span>Feature Flags</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <div className="flex flex-col gap-1 px-1 pt-1">
              {entries.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">No feature flags available</p>
              ) : (
                entries.map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent cursor-pointer"
                  >
                    <span className="text-xs">{FEATURE_FLAG_LABELS[key] ?? key}</span>
                    <Switch
                      checked={value}
                      onCheckedChange={(v) => onToggle(key, v)}
                    />
                  </label>
                ))
              )}
            </div>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
