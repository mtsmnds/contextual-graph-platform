import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Badge' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Draft' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Deleted' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
}
