import { useGraphStore } from "@/store/useGraphStore"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "@phosphor-icons/react"
import FeatureFlagsSectionContainer from "./sections/FeatureFlagsSectionContainer"
import BackupsSectionContainer from "./sections/BackupsSectionContainer"
import WorkspaceInfoSectionContainer from "./sections/WorkspaceInfoSectionContainer"

export default function AppSidebar({ onOpenFolder }: { onOpenFolder: () => void }) {
  const viewport = useGraphStore((s) => s.canvas.viewport)

  return (
    <Sidebar side="right" collapsible="offcanvas" variant="floating" className="py-4">
      <SidebarHeader className="px-3 py-2">
        <span className="text-sm font-semibold">Workspace</span>
      </SidebarHeader>
      <SidebarContent>
        <FeatureFlagsSectionContainer />
        <BackupsSectionContainer />
        <WorkspaceInfoSectionContainer viewport={viewport} />
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
