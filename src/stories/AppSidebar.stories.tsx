import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/canvas/panels/AppSidebar'

function SidebarDemo() {
  return (
    <SidebarProvider defaultOpen>
      <SidebarInset>
        <div className="flex items-center gap-2 px-4 py-2">
          <SidebarTrigger variant="outline" size="icon-sm" aria-label="Workspace menu" />
          <span className="text-sm text-muted-foreground">Main content area</span>
        </div>
      </SidebarInset>
      <AppSidebar onOpenFolder={() => {}} />
    </SidebarProvider>
  )
}

const meta = {
  title: 'Canvas/AppSidebar',
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
    await expect(canvas.getByText('Workspace')).toBeInTheDocument()
  },
}
