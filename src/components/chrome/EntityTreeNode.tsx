import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import { compareSortOrder } from "../../engine/queries"
import { SegmentCard } from "../SegmentCard"
import { ContainerCard } from "../ContainerCard"
import ContentEditor from "../ContentEditor"

function EntityTreeNode({ entityId }: { entityId: string }) {
  const entity = useGraphStore((s) => s.entities.find((e) => e.id === entityId))
  const relations = useGraphStore((s) => s.relations)
  const textCollapsed = useChromeStore((s) => s.textCollapsed)
  const toggleTextCollapsed = useChromeStore((s) => s.toggleTextCollapsed)

  if (!entity) return null

  if (entity.type !== "container") {
    return (
      <SegmentCard>
        <ContentEditor
          content={entity.content ?? ""}
          onChange={(value) =>
            useGraphStore.getState().updateEntity(entityId, { content: value })
          }
        />
      </SegmentCard>
    )
  }

  const isCollapsed = textCollapsed.has(entityId)
  const childRelations = relations
    .filter((r) => r.type === "contains" && r.source === entityId)
    .sort((a, b) => compareSortOrder(a.sortOrder, b.sortOrder))

  return (
    <ContainerCard
      className="overflow-visible"
      header={
        <button
          className="flex items-center gap-1.5 text-sm font-semibold w-full text-left"
          onClick={() => toggleTextCollapsed(entityId)}
        >
          <span className="w-4 shrink-0">{isCollapsed ? "▸" : "▾"}</span>
          {entity.content || entity.id}
        </button>
      }
    >
      {!isCollapsed &&
        childRelations.map((rel) => (
          <EntityTreeNode key={rel.target} entityId={rel.target} />
        ))}
    </ContainerCard>
  )
}

export default EntityTreeNode
