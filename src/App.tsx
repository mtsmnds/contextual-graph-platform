import { BrowserRouter, Routes, Route } from "react-router-dom"
import WorkspaceRoot from "./routes/WorkspaceRoot"
import LegacyApp from "./routes/LegacyApp"
import VizTest1 from "./routes/VizTest1"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceRoot />} />
        <Route path="/tiptap-editor-test" element={<LegacyApp />} />
        <Route path="/viz-test-1" element={<VizTest1 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
