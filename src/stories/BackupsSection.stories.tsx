import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import BackupsSection from '@/canvas/panels/sections/BackupsSection'
import { withSidebarSection } from '../../.storybook/decorators'

const meta = {
  title: 'Canvas/Sidebar/BackupsSection',
  component: BackupsSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  args: {
    manualBackups: [],
    autoSnapshots: [],
    recentSnapshots: [],
    isCreating: false,
    createError: null,
    isWorkspaceEmpty: false,
    hasFileSystem: true,
    hasAnyContent: false,
    onCreateBackup: fn(),
    onRestoreClick: fn(),
    onDeleteClick: fn(),
    onDismissAutoSnapshots: fn(),
    confirmRestoreOpen: false,
    confirmDeleteOpen: false,
    restoreTarget: null,
    deleteTarget: null,
    onConfirmRestore: fn(),
    onCancelRestore: fn(),
    onConfirmDelete: fn(),
    onCancelDelete: fn(),
  },
} satisfies Meta<typeof BackupsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
