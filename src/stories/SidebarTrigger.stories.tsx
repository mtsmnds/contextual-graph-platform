import type { Meta, StoryObj } from '@storybook/react-vite'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

const meta = {
  title: 'Buttons & Sidebar/SidebarTrigger',
  component: SidebarTrigger,
  decorators: [(Story) => <SidebarProvider><Story /></SidebarProvider>],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarTrigger>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
