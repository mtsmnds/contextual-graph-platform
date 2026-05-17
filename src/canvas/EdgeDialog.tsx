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

interface EdgeDialogProps {
  open: boolean
  initialType?: string
  initialSortOrder?: string
  onConfirm: (type: string, sortOrder: string) => void
  onCancel: () => void
}

function EdgeDialog({ open, initialType = "related_to", initialSortOrder = "", onConfirm, onCancel }: EdgeDialogProps) {
  const [type, setType] = useState(initialType)
  const [sortOrder, setSortOrder] = useState(initialSortOrder)

  const handleConfirm = () => {
    onConfirm(type.trim(), sortOrder.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Relation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Relation Type</label>
            <Input value={type} onChange={(e) => setType(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sort Order</label>
            <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="fractional-indexing key" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EdgeDialog
