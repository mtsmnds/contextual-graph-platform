import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/canvas/panels/AppSidebar'

function SidebarDemo({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full">
        <div className="relative flex-1">
          <div className="absolute top-2 right-2">
            <SidebarTrigger variant="ghost" aria-label="Workspace menu" />
          </div>
          <div className="p-4 text-sm text-muted-foreground">
            Main content area
          </div>
        </div>
      </div>
      <AppSidebar onOpenFolder={() => {}} />
    </SidebarProvider>
  )
}

const meta = {
  title: 'Buttons & Sidebar/AppSidebar',
  component: SidebarDemo,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs', 'ai-generated'],
  args: { defaultOpen: true },
} satisfies Meta<typeof SidebarDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const Closed: Story = {
  args: { defaultOpen: false },
}

export const ToggleSidebar: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByLabelText('Workspace menu')
    await expect(trigger).toBeInTheDocument()
    await userEvent.click(trigger)
    await expect(trigger).toBeInTheDocument()
    await userEvent.click(trigger)
    await expect(canvas.getByText('Workspace')).toBeVisible()
  },
}
