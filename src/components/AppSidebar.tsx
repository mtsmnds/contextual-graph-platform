import { useMemo } from "react"
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
import { House, BookOpen, MapIcon, StickyNote, Plus } from "lucide-react"

export function AppSidebar() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const focusedEntityId = useGraphStore((s) => s.view.focusedEntityId)
  const focusEntity = useGraphStore((s) => s.focusEntity)
  const addEntity = useGraphStore((s) => s.addEntity)

  const rootContainers = useMemo(
    () => getRootContainers({ entities, relations }),
    [entities, relations],
  )

  const handleNewPage = () => {
    const id = addEntity("container", { title: "Untitled" })
    focusEntity(id)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
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
