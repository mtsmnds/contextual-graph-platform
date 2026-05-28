import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { IconButton } from '@/components/ui/icon-button'
import { Plus } from '@phosphor-icons/react'

const meta = {
  title: 'Buttons & Sidebar/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
  },
  args: { variant: 'outline', onClick: fn() },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: <Plus />, 'aria-label': 'Add' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: <Plus />, 'aria-label': 'Add' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: <Plus />, 'aria-label': 'Add' },
}

export const Disabled: Story = {
  args: { children: <Plus />, 'aria-label': 'Add', disabled: true },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: <Plus />, 'aria-label': 'Delete' },
}

export const ClickInteraction: Story = {
  args: { children: 'Click', onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
