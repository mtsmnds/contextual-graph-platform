import { useState, useCallback } from "react"
import { DEFAULT_LAYOUT_OPTIONS } from "@/engine/layout"
import type { LayoutOptions } from "@/engine/layout"
import CanvasLayoutSection from "./CanvasLayoutSection"

export default function CanvasLayoutSectionContainer({
  onRunLayout,
}: {
  onRunLayout: (options: LayoutOptions) => void
}) {
  const [options, setOptions] = useState<LayoutOptions>({ ...DEFAULT_LAYOUT_OPTIONS })

  const handleChange = useCallback((update: Partial<LayoutOptions>) => {
    setOptions((prev) => ({ ...prev, ...update }))
  }, [])

  const handleRunLayout = useCallback(() => {
    onRunLayout(options)
  }, [options, onRunLayout])

  return (
    <CanvasLayoutSection
      options={options}
      onChange={handleChange}
      onRunLayout={handleRunLayout}
    />
  )
}
