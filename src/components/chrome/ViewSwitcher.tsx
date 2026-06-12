import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useChromeStore, type ActiveView } from "../../store/useChromeStore"

function ViewSwitcher() {
  const activeView = useChromeStore((s) => s.activeView)
  const setActiveView = useChromeStore((s) => s.setActiveView)

  const views: { key: ActiveView; label: string }[] = [
    { key: "canvas", label: "Canvas" },
    { key: "text", label: "Text" },
  ]

  return (
    <div className="px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">View</span>
      <ButtonGroup className="w-full">
        {views.map(({ key, label }) => (
          <Button
            key={key}
            variant={activeView === key ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveView(key)}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}

export default ViewSwitcher
