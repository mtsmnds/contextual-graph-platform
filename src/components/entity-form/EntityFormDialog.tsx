import { useState, useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { EntityForm, type EntityFormProps } from "./EntityForm"

export function EntityFormDialog(props: EntityFormProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = useCallback(
    (entityId: string) => {
      setOpen(false)
      props.onSubmit?.(entityId)
    },
    [props.onSubmit],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="default" size="sm">
            <PlusIcon className="mr-1 size-4" />
            New Entity
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Entity</DialogTitle>
          <DialogDescription>
            Add a new entity to the graph with optional relations.
          </DialogDescription>
        </DialogHeader>
        <EntityForm {...props} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
