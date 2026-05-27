import { useGraphStore } from "@/store/useGraphStore"
import FeatureFlagsSection from "./FeatureFlagsSection"

export default function FeatureFlagsSectionContainer() {
  const flags = useGraphStore((s) => s.featureFlags)
  const onToggle = useGraphStore((s) => s.setFeatureFlag)

  return <FeatureFlagsSection flags={flags} onToggle={onToggle} />
}
