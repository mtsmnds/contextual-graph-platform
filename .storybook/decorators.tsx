import type { ReactNode } from 'react'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar'

export function withSidebarSection(Story: () => ReactNode) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="right" collapsible="none" className="relative w-[280px]">
        <SidebarContent>
          <Story />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
