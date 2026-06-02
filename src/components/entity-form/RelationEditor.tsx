import { useMemo, useState, useCallback } from "react"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { useGraphStore } from "@/store/useGraphStore"
import { getContainerChildren, getRelationTypes } from "@/engine/queries"
import type { Entity } from "@/types/graph"

export type RelationRow = {
  id: string
  type: string
  targetId: string
} & (
  | { kind: "contains"; position: "beginning" | "end" | "after" }
  | { kind: "other" }
)

export function RelationEditor({
  value,
  onChange,
  onRemove,
  showRemove,
}: {
  value: RelationRow
  onChange: (row: RelationRow) => void
  onRemove: () => void
  showRemove: boolean
}) {
  const [typeOpen, setTypeOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)

  const entities = useGraphStore((s) => s.entities)
  const relationTypes = useMemo(() => getRelationTypes(useGraphStore.getState()), [])

  const isContains = value.kind === "contains"

  const children = useMemo(() => {
    if (!isContains || !value.targetId) return [] as Entity[]
    const state = useGraphStore.getState()
    return getContainerChildren(state, value.targetId)
  }, [isContains, value.targetId])

  const entityOptions = useMemo(
    () => entities.filter((e) => e.id !== value.targetId),
    [entities, value.targetId],
  )

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === value.targetId),
    [entities, value.targetId],
  )

  const setType = useCallback(
    (type: string) => {
      if (type === "contains") {
        onChange({
          ...value,
          type,
          kind: "contains",
          position: "end",
        } as RelationRow)
      } else {
        onChange({ ...value, type, kind: "other" } as RelationRow)
      }
    },
    [value, onChange],
  )

  const setTarget = useCallback(
    (targetId: string) => {
      onChange({ ...value, targetId } as RelationRow)
    },
    [value, onChange],
  )

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Relation</Label>
        {showRemove && (
          <Button variant="ghost" size="icon-xs" onClick={onRemove} aria-label="Remove relation">
            <XIcon className="size-3" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={typeOpen}
                aria-label="Select relation type"
                className="w-full justify-between text-xs h-7"
              />
            }
          >
            {value.type || "Type..."}
            <ChevronDownIcon className="ml-2 size-3 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[--trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Relation type..." className="h-7 text-xs" />
              <CommandList>
                <CommandEmpty className="py-3 text-xs">No type found</CommandEmpty>
                <CommandGroup>
                  {relationTypes.map((type) => (
                    <CommandItem
                      key={type}
                      value={type}
                      className="text-xs"
                      onSelect={() => {
                        setType(type)
                        setTypeOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 size-3",
                          value.type === type ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {type}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={targetOpen} onOpenChange={setTargetOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={targetOpen}
                aria-label="Select target entity"
                className="w-full justify-between text-xs h-7"
              />
            }
          >
            {selectedEntity?.content || selectedEntity?.id || "Target..."}
            <ChevronDownIcon className="ml-2 size-3 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[--trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search entities..." className="h-7 text-xs" />
              <CommandList>
                <CommandEmpty className="py-3 text-xs">No entities found</CommandEmpty>
                <CommandGroup>
                  {entityOptions.map((entity) => (
                    <CommandItem
                      key={entity.id}
                      value={entity.id}
                      className="text-xs"
                      onSelect={() => {
                        setTarget(entity.id)
                        setTargetOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 size-3 shrink-0",
                          value.targetId === entity.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{entity.content || entity.id}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        {entity.type}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isContains && value.targetId && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Place after</Label>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-mono border transition-colors cursor-pointer",
                  value.position === "beginning"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:bg-accent",
                )}
                onClick={() =>
                  onChange({ ...value, position: "beginning" } as RelationRow)
                }
              >
                (beginning)
              </button>
              {children.map((child, i) => (
                <button
                  key={child.id}
                  type="button"
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-mono border transition-colors cursor-pointer truncate max-w-[120px]",
                    value.position === "after" &&
                      (value as any).siblingId === child.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:bg-accent",
                  )}
                  onClick={() =>
                    onChange({
                      ...value,
                      position: "after",
                      siblingId: child.id,
                    } as any)
                  }
                >
                  {i + 1}. {child.content || child.id}
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-mono border transition-colors cursor-pointer",
                  value.position === "end"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:bg-accent",
                )}
                onClick={() =>
                  onChange({ ...value, position: "end" } as RelationRow)
                }
              >
                (end)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
