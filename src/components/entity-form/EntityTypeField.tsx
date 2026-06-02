import { useState } from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
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

const ENTITY_TYPES = ["segment", "container", "annotation", "concept", "summary"] as const

export function EntityTypeField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  const allTypes = ENTITY_TYPES as readonly string[]

  return (
    <div className="space-y-1.5">
      <Label>Type</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select entity type"
              className="w-full justify-between"
            />
          }
        >
          {value || "Select entity type..."}
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search or create type..." />
            <CommandList>
              <CommandEmpty>No type found. Press Enter to create.</CommandEmpty>
              <CommandGroup>
                {allTypes.map((type) => (
                  <CommandItem
                    key={type}
                    value={type}
                    onSelect={() => {
                      onChange(type === value ? "" : type)
                      setOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value === type ? "opacity-100" : "opacity-0",
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
    </div>
  )
}
