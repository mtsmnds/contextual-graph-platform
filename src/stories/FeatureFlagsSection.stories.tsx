import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar'
import FeatureFlagsSection from '@/canvas/panels/sections/FeatureFlagsSection'

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="right" collapsible="none" className="relative w-[280px]">
        <SidebarContent>{children}</SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

const meta = {
  title: 'Canvas/Sidebar/FeatureFlagsSection',
  component: FeatureFlagsSection,
  decorators: [(Story) => <SectionWrapper><Story /></SectionWrapper>],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof FeatureFlagsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ToggleFlag: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('switch')
    await userEvent.click(toggle)
    await expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).not.toBeChecked()
  },
}
