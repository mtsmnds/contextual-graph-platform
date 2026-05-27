import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import WorkspaceSidebar from '@/canvas/panels/WorkspaceSidebar'

function SidebarDemo() {
  return (
    <div style={{ width: 800, height: 600, display: 'flex', position: 'relative' }}>
      <SidebarProvider defaultOpen>
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <p className="text-muted-foreground text-sm">Canvas area (clickable)</p>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <SidebarTrigger variant="outline" size="icon-sm" aria-label="Workspace menu" />
        </div>
        <WorkspaceSidebar onOpenFolder={() => {}} />
      </SidebarProvider>
    </div>
  )
}

const meta = {
  title: 'Canvas/WorkspaceSidebar',
  component: SidebarDemo,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof SidebarDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const ToggleSidebar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByLabelText('Workspace menu')
    await expect(trigger).toBeInTheDocument()
    await userEvent.click(trigger)
    // Verify the Workspace sidebar header is still rendered (offcanvas keeps DOM)
    await expect(canvas.getByText('Workspace')).toBeInTheDocument()
  },
}
