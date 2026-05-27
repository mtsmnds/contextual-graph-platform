import { useGraphStore } from "@/store/useGraphStore"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { FolderOpen, X } from "@phosphor-icons/react"
import FeatureFlagsSection from "./sections/FeatureFlagsSection"
import BackupsSection from "./sections/BackupsSection"
import WorkspaceInfoSection from "./sections/WorkspaceInfoSection"

export default function WorkspaceSidebar({ onOpenFolder }: { onOpenFolder: () => void }) {
  const viewport = useGraphStore((s) => s.canvas.viewport)

  return (
    <Sidebar side="right" collapsible="offcanvas" variant="floating">
      <SidebarHeader className="flex-row items-center justify-between px-3 py-2">
        <span className="text-sm font-semibold">Workspace</span>
        <SidebarTrigger>
          <X />
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent>
        <FeatureFlagsSection />
        <BackupsSection />
        <WorkspaceInfoSection viewport={viewport} />
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onOpenFolder}
        >
          <FolderOpen />
          Open Folder
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
