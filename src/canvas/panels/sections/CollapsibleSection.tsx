import type { ReactNode } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { CaretDown } from "@phosphor-icons/react"

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <SidebarGroup>
        <CollapsibleTrigger nativeButton={false} render={<SidebarGroupLabel />} className="group gap-1.5">
          <CaretDown className="size-3 shrink-0 -rotate-90 group-data-[panel-open]:rotate-0 transition-transform" />
          <span>{title}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent className="px-1">
            {children}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export { CollapsibleSection }
