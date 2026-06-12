import WorkspaceShell from "../components/chrome/WorkspaceShell"
import GraphCanvas from "../canvas/GraphCanvas"

function WorkspaceRoot() {
  return (
    <WorkspaceShell>
      <GraphCanvas />
    </WorkspaceShell>
  )
}

export default WorkspaceRoot
