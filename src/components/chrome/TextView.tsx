import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import EntityTreeNode from "./EntityTreeNode"

function TextView() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)
  const openContainers = useChromeStore((s) => s.openContainers)

  const childIds = new Set(
    relations.filter((r) => r.type === "contains").map((r) => r.target)
  )
  const roots = entities.filter((e) => !childIds.has(e.id))
  const columnIds = openContainers.length > 0 ? openContainers : roots.map((e) => e.id)

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-4 p-4">
        {columnIds.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Text view — {entities.length} entities loaded
          </p>
        )}
        {columnIds.map((id) => (
          <div key={id} className="w-[512px] min-w-[512px] h-full overflow-y-auto">
            <EntityTreeNode entityId={id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TextView
