import { BrowserRouter, Routes, Route } from "react-router-dom"
import WorkspaceRoot from "./routes/WorkspaceRoot"
import LegacyApp from "./routes/LegacyApp"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceRoot />} />
        <Route path="/tiptap-editor-test" element={<LegacyApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
