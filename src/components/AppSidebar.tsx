import { useMemo, useCallback } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import { getRootContainers } from "@/engine/queries"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { House, BookOpen, MapIcon, StickyNote, Plus, FolderOpen } from "lucide-react"
import { getFSAccessInstance, setAdapter } from "@/store/persistence"

export function AppSidebar() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const focusedEntityId = useGraphStore((s) => s.view.focusedEntityId)
  const focusEntity = useGraphStore((s) => s.focusEntity)
  const addEntity = useGraphStore((s) => s.addEntity)
  const adapterId = useGraphStore((s) => s.adapterId)
  const folderName = useGraphStore((s) => s.folderName)
  const init = useGraphStore((s) => s.init)
  const refreshFolderName = useGraphStore((s) => s.refreshFolderName)

  const rootContainers = useMemo(
    () => getRootContainers({ entities, relations }),
    [entities, relations],
  )

  const handleNewPage = () => {
    const id = addEntity("container", { title: "Untitled" })
    focusEntity(id)
  }

  const handleOpenFolder = useCallback(async () => {
    const fsa = getFSAccessInstance()
    const picked = await fsa.initFromPicker()
    if (!picked) return

    const existing = await fsa.loadWorkspace()
    if (existing) {
      setAdapter(fsa)
      await init(fsa)
    } else {
      const state = useGraphStore.getState()
      const snapshot = { version: 1 as const, entities: state.entities, relations: state.relations }
      await fsa.saveGraph(snapshot)
      for (const entity of state.entities) {
        if (entity.kind === "container") {
          const content = state.getContent(entity.id)
          if (content) {
            await fsa.saveDocument(entity.id, content).catch(() => {})
          }
        }
      }
      setAdapter(fsa)
      refreshFolderName()
    }
  }, [init, refreshFolderName])

  const showOpenFolder = adapterId !== "fs-access" && typeof window !== "undefined" && "showDirectoryPicker" in window

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {folderName ? (
          <div className="px-3 py-1.5">
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium truncate max-w-[160px]">
                  {folderName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumb>
          </div>
        ) : null}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={focusedEntityId === null}
              onClick={() => focusEntity(null)}
            >
              <House />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {rootContainers.map((entity) => (
                <SidebarMenuItem key={entity.id}>
                  <SidebarMenuButton
                    isActive={focusedEntityId === entity.id}
                    onClick={() => focusEntity(entity.id)}
                  >
                    {entity.metadata?.type === "work" ? (
                      <BookOpen />
                    ) : entity.metadata?.type === "roadmap" ? (
                      <MapIcon />
                    ) : (
                      <StickyNote />
                    )}
                    <span>{entity.title ?? entity.id}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {showOpenFolder ? (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleOpenFolder}>
                <FolderOpen />
                <span>Open Folder…</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleNewPage}>
              <Plus />
              <span>New page</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
