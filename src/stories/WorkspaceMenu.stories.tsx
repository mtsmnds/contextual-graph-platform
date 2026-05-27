import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@/components/ui/button'
import { DotsThreeOutline } from '@phosphor-icons/react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ButtonGroup } from '@/components/ui/button-group'
import { ArrowUUpLeft, ArrowUUpRight, Plus, FolderOpen } from '@phosphor-icons/react'

function MenuPreview() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger
        render={<Button variant="outline" size="icon-sm" aria-label="Workspace menu" />}
      >
        <DotsThreeOutline />
      </PopoverTrigger>
      <PopoverContent className="w-[260px]" align="end" sideOffset={8}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
            <ButtonGroup>
              <Button variant="outline" size="sm" aria-label="Undo" disabled>
                <ArrowUUpLeft />
              </Button>
              <Button variant="outline" size="sm" aria-label="Redo" disabled>
                <ArrowUUpRight />
              </Button>
            </ButtonGroup>
          </div>

          <div className="border-t" />

          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 2px' }}>
            Backups
          </span>

          <Button variant="outline" size="sm" className="w-full justify-start gap-2" disabled>
            <Plus />
            Nothing to back up yet
          </Button>

          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', padding: '8px 0', textAlign: 'center' }}>
            No backups yet. Create one with the + button above.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const meta = {
  title: 'Canvas/WorkspaceMenu',
  component: MenuPreview,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof MenuPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithUndoHistory: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger
        render={<Button variant="outline" size="icon-sm" aria-label="Workspace menu" />}
      >
        <DotsThreeOutline />
      </PopoverTrigger>
      <PopoverContent className="w-[260px]" align="end" sideOffset={8}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
            <ButtonGroup>
              <Button variant="outline" size="sm" aria-label="Undo">
                <ArrowUUpLeft />
              </Button>
              <Button variant="outline" size="sm" aria-label="Redo">
                <ArrowUUpRight />
              </Button>
            </ButtonGroup>
          </div>

          <div className="border-t" />

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <FolderOpen />
            Open Folder
          </Button>

          <div className="border-t" />

          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 2px' }}>
            Backups
          </span>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Plus />
            Save checkpoint now
          </Button>

          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 2px' }}>
            Recent Snapshots
          </span>

          {['Moved node', 'Added entity', 'Updated label'].map((desc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 6, padding: '2px 6px', fontSize: 12 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>{`${i + 1}m ago`}</span>
              <span style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>&mdash;</span>
              {desc}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  ),
}
