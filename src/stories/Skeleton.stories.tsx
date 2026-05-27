import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from '@/components/ui/skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 300 }}>
      <Skeleton style={{ height: 16, width: '80%' }} />
      <Skeleton style={{ height: 16, width: '60%' }} />
      <Skeleton style={{ height: 16, width: '70%' }} />
    </div>
  ),
}

export const Card: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280, padding: 16 }}>
      <Skeleton style={{ height: 140, width: '100%', borderRadius: 8 }} />
      <Skeleton style={{ height: 16, width: '70%' }} />
      <Skeleton style={{ height: 14, width: '90%' }} />
      <Skeleton style={{ height: 14, width: '50%' }} />
    </div>
  ),
}
