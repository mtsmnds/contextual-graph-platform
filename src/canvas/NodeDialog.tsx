import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { EntityKind } from "../types/graph"

interface NodeDialogProps {
  open: boolean
  mode: "create" | "edit"
  initialTitle?: string
  initialKind?: EntityKind
  onConfirm: (title: string, kind: EntityKind) => void
  onCancel: () => void
}

const KINDS: { value: EntityKind; label: string }[] = [
  { value: "container", label: "Container" },
  { value: "concept", label: "Concept" },
  { value: "annotation", label: "Annotation" },
  { value: "summary", label: "Summary" },
]

function NodeDialog({ open, mode, initialTitle = "", initialKind = "container", onConfirm, onCancel }: NodeDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [kind, setKind] = useState<EntityKind>(initialKind)

  const handleConfirm = () => {
    onConfirm(title.trim(), kind)
    setTitle("")
    setKind("container")
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Node" : "Edit Node"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <select
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as EntityKind)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>{mode === "create" ? "Create" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NodeDialog
