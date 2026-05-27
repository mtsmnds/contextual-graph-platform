import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar'
import WorkspaceInfoSection from '@/canvas/panels/sections/WorkspaceInfoSection'

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
  title: 'Canvas/Sidebar/WorkspaceInfoSection',
  component: WorkspaceInfoSection,
  decorators: [(Story) => <SectionWrapper><Story /></SectionWrapper>],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof WorkspaceInfoSection>

export default meta
type Story = StoryObj<typeof meta>

export const WithViewport: Story = {
  args: { viewport: { x: 725, y: 396.5, zoom: 1 } },
}

export const WithoutViewport: Story = {}
