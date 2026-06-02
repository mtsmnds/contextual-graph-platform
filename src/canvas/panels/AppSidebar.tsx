import { useGraphStore } from "@/store/useGraphStore"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "@phosphor-icons/react"
import type { LayoutOptions } from "@/engine/layout"
import FeatureFlagsSectionContainer from "./sections/FeatureFlagsSectionContainer"
import CanvasLayoutSectionContainer from "./sections/CanvasLayoutSectionContainer"
import BackupsSectionContainer from "./sections/BackupsSectionContainer"
import WorkspaceInfoSectionContainer from "./sections/WorkspaceInfoSectionContainer"
import SelectionMetadataSectionContainer from "./sections/SelectionMetadataSectionContainer"

/**
 * Right-side collapsible workspace sidebar.
 * Shows feature flags, backups/snapshots, and workspace metadata.
 * Collapses to an off-canvas overlay — use `SidebarTrigger` to toggle.
 */
export default function AppSidebar({
  onOpenFolder,
  onRunLayout,
}: {
  onOpenFolder: () => void
  onRunLayout: (options: LayoutOptions) => void
}) {
  const folderName = useGraphStore((s) => s.folderName)
  const autoLayout = useGraphStore((s) => s.featureFlags.autoLayout)

  return (
    <Sidebar side="right" collapsible="offcanvas" variant="floating" className="py-4">
      <SidebarHeader className="px-3 py-2">
        <span className="text-sm font-semibold truncate">{folderName ?? "Workspace"}</span>
      </SidebarHeader>
      <SidebarContent>
        <SelectionMetadataSectionContainer />
        <BackupsSectionContainer />
        <WorkspaceInfoSectionContainer />
        <FeatureFlagsSectionContainer />
        {autoLayout && <CanvasLayoutSectionContainer onRunLayout={onRunLayout} />}
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
