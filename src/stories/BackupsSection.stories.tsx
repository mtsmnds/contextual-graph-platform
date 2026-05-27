import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar'
import BackupsSection from '@/canvas/panels/sections/BackupsSection'

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
  title: 'Canvas/Sidebar/BackupsSection',
  component: BackupsSection,
  decorators: [(Story) => <SectionWrapper><Story /></SectionWrapper>],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof BackupsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
