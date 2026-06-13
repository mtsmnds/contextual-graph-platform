import { useChromeStore } from "../../store/useChromeStore"
import EntityTreeNode from "./EntityTreeNode"
import WorkspaceTree from "./WorkspaceTree"

function TextView() {
  const openContainers = useChromeStore((s) => s.openContainers)

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-4 p-4">
        {openContainers.map((id) => (
          <div key={id} className="w-[512px] min-w-[512px] h-full overflow-y-auto">
            <EntityTreeNode entityId={id} />
          </div>
        ))}
        {openContainers.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No containers open — click a container in the tree
          </p>
        )}
        <div className="w-[300px] min-w-[300px] h-full overflow-y-auto border-l border-border pl-4">
          <WorkspaceTree />
        </div>
      </div>
    </div>
  )
}

export default TextView
