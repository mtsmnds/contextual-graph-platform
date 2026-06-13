import { useEffect } from "react"
import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import { compareSortOrder } from "../../engine/queries"
import { SegmentCard } from "../SegmentCard"
import { ContainerCard } from "../ContainerCard"
import ContentEditor from "../ContentEditor"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible"
import { CaretDown, Plus } from "@phosphor-icons/react"

function EntityTreeNode({ entityId }: { entityId: string }) {
  const entity = useGraphStore((s) => s.entities.find((e) => e.id === entityId))
  const relations = useGraphStore((s) => s.relations)
  const manifest = useGraphStore((s) => s.manifest)
  const textCollapsed = useChromeStore((s) => s.textCollapsed)
  const toggleCollapsed = useChromeStore((s) => s.toggleTextCollapsed)

  useEffect(() => {
    if (manifest && entity && manifest.collections[entityId]) {
      useGraphStore.getState().loadBookContent(entityId)
    }
  }, [entityId, entity?.id, manifest])

  if (!entity) return null

  if (entity.type !== "container") {
    return (
      <SegmentCard width="100%">
        <ContentEditor
          content={entity.content ?? ""}
          onChange={(value) =>
            useGraphStore.getState().updateEntity(entityId, { content: value })
          }
          placeholder="Type here..."
        />
      </SegmentCard>
    )
  }

  const isCollapsed = textCollapsed.has(entityId)
  const childRelations = relations
    .filter((r) => r.type === "contains" && r.source === entityId)
    .sort((a, b) => compareSortOrder(a.sortOrder, b.sortOrder))

  return (
    <Collapsible defaultOpen={!isCollapsed} onOpenChange={() => toggleCollapsed(entityId)}>
      <ContainerCard
        header={
          <div className="flex items-center gap-2">
            <ContentEditor
              content={entity.content ?? ""}
              className="font-semibold text-sm flex-1"
              onChange={(value) =>
                useGraphStore.getState().updateEntity(entityId, { content: value })
              }
              placeholder="Untitled"
            />
            <CollapsibleTrigger className="p-1 rounded hover:bg-accent cursor-pointer text-muted-foreground transition-transform data-[open]:rotate-0 -rotate-90">
              <CaretDown size={14} />
            </CollapsibleTrigger>
          </div>
        }
        footer={
          <button
            onClick={() => {
              useGraphStore.getState().addEntity("segment", {
                canvasData: { x: 0, y: 0, width: 208, height: 64 },
              }, entityId)
            }}
            className="mx-auto block p-1 rounded hover:bg-accent cursor-pointer text-muted-foreground"
            aria-label="Add segment"
          >
            <Plus size={16} />
          </button>
        }
      >
        <CollapsibleContent className="flex flex-col gap-2 flex-1 min-h-[60px] bg-accent/15 p-3">
          {childRelations.map((rel) => (
            <EntityTreeNode key={rel.target} entityId={rel.target} />
          ))}
        </CollapsibleContent>
      </ContainerCard>
    </Collapsible>
  )
}

export default EntityTreeNode
