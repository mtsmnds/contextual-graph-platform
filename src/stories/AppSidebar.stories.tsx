import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/canvas/panels/AppSidebar'

const meta = {
  title: 'Buttons & Sidebar/AppSidebar',
  component: AppSidebar,
  decorators: [
    (Story, { parameters }) => (
      <SidebarProvider defaultOpen={parameters.sidebarOpen ?? true}>
        <div className="flex h-screen w-full">
          <div className="relative flex-1">
            <div className="absolute top-2 right-2">
              <SidebarTrigger aria-label="Workspace menu" />
            </div>
            <div className="p-4 text-sm text-muted-foreground">Main content area</div>
          </div>
        </div>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: { onOpenFolder: fn() },
  argTypes: {
    onOpenFolder: { description: 'Opens a folder from the filesystem (FS Access API).' },
  },
  parameters: { layout: 'fullscreen', sidebarOpen: true },
  tags: ['autodocs'],
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The sidebar is open by default, showing feature flags, backups, and workspace info.
 */
export const Open: Story = {}

/**
 * The sidebar is collapsed to an off-canvas overlay.
 * The trigger button remains visible to reopen it.
 */
export const Closed: Story = {
  parameters: { sidebarOpen: false },
}

/**
 * Click the trigger button to toggle the sidebar open and closed.
 */
export const ToggleSidebar: Story = {
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
