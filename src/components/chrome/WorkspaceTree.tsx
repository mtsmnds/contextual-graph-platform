import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import { compareSortOrder } from "../../engine/queries"
import { ContainerCard } from "../ContainerCard"

function TreeItem({
  entityId,
  prefix,
  isLast,
}: {
  entityId: string
  prefix: string
  isLast: boolean
}) {
  const entity = useGraphStore((s) => s.entities.find((e) => e.id === entityId))
  const relations = useGraphStore((s) => s.relations)
  const entities = useGraphStore((s) => s.entities)
  const addContainer = useChromeStore((s) => s.addContainer)

  if (!entity || entity.type !== "container") return null

  const childRelations = relations
    .filter((r) => r.type === "contains" && r.source === entityId)
    .sort((a, b) => compareSortOrder(a.sortOrder, b.sortOrder))

  const containerChildren = childRelations.filter((r) => {
    const child = entities.find((e) => e.id === r.target)
    return child?.type === "container"
  })

  const connector = isLast ? "└── " : "├── "
  const childPrefix = isLast ? "    " : "│   "

  const handleClick = () => {
    if (containerChildren.length > 0) {
      containerChildren.forEach((r) => addContainer(r.target))
    } else {
      addContainer(entityId)
    }
  }

  return (
    <>
      <div className="truncate">
        <span className="whitespace-pre">{prefix}{connector}</span>
        <button
          className="cursor-pointer hover:underline text-foreground inline"
          onClick={handleClick}
        >
          {entity.content || entity.id}
        </button>
      </div>
      {containerChildren.map((r, i) => (
        <TreeItem
          key={r.target}
          entityId={r.target}
          prefix={prefix + childPrefix}
          isLast={i === containerChildren.length - 1}
        />
      ))}
    </>
  )
}

function WorkspaceTree() {
  const entities = useGraphStore((s) => s.entities)
  const relations = useGraphStore((s) => s.relations)

  const childIds = new Set(
    relations.filter((r) => r.type === "contains").map((r) => r.target)
  )
  const roots = entities
    .filter((e) => e.type === "container" && !childIds.has(e.id))

  return (
    <ContainerCard header={<span className="font-semibold text-sm">Workspace</span>}>
      {roots.length === 0 ? (
        <p className="p-3 text-muted-foreground text-sm">No containers found</p>
      ) : (
        <div className="p-3 font-mono text-sm space-y-0.5">
          {roots.map((root, i) => (
            <TreeItem
              key={root.id}
              entityId={root.id}
              prefix=""
              isLast={i === roots.length - 1}
            />
          ))}
        </div>
      )}
    </ContainerCard>
  )
}

export default WorkspaceTree
