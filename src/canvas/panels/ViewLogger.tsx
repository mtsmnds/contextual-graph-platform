import { useStore } from "@xyflow/react"
import { ButtonGroup } from "@/components/ui/button-group"

export default function ViewLogger() {
  const [x, y, zoom] = useStore((s) => s.transform)

  return (
    <ButtonGroup>
      <span className="flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 font-mono text-[11px] tabular-nums text-muted-foreground shadow-xs">
        <span>x: {x.toFixed(1)}</span>
        <span className="text-border">|</span>
        <span>y: {y.toFixed(1)}</span>
        <span className="text-border">|</span>
        <span>{Math.round(zoom * 100)}%</span>
      </span>
    </ButtonGroup>
  )
}
