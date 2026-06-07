import type { Meta, StoryObj } from '@storybook/react-vite'
import { SegmentCard } from '@/components/SegmentCard'

const LONG_CONTENT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`

const meta = {
  title: 'Components/SegmentCard',
  component: SegmentCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  argTypes: {
    width: {
      description: 'Fixed width of the card (number or CSS string)',
      control: 'text',
    },
    children: {
      description: 'Content that determines the card height',
      control: 'text',
    },
  },
} satisfies Meta<typeof SegmentCard>

export default meta
type Story = StoryObj<typeof meta>

export const ShortContent: Story = {
  args: {
    width: 208,
    children: 'Hello World',
  },
}

export const LongContent: Story = {
  args: {
    width: 208,
    children: LONG_CONTENT,
  },
}

export const EmptyContent: Story = {
  args: {
    width: 208,
  },
}

export const CustomWidth: Story = {
  args: {
    width: 400,
    children: 'This card has a wider fixed width of 400px',
  },
}
