import { ButtonGroup } from "@/components/ui/button-group"
import { IconButton } from "@/components/ui/icon-button"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onZoom100,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onZoom100: () => void
}) {
  return (
    <ButtonGroup>
      <IconButton variant="outline" aria-label="Zoom In" onClick={onZoomIn}>
        <ZoomIn data-icon />
      </IconButton>
      <IconButton variant="outline" aria-label="Zoom Out" onClick={onZoomOut}>
        <ZoomOut data-icon />
      </IconButton>
      <IconButton variant="outline" aria-label="Fit View" onClick={onFitView}>
        <Maximize data-icon />
      </IconButton>
      <IconButton variant="outline" aria-label="Zoom to 100%" onClick={onZoom100}>
        <span className="text-xs font-semibold tabular-nums">1:1</span>
      </IconButton>
    </ButtonGroup>
  )
}
