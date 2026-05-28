import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { Plus } from '@phosphor-icons/react'

const meta = {
  title: 'Buttons & Sidebar/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
  },
  args: { variant: 'outline', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Button' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
}

export const Link: Story = {
  args: { variant: 'link', children: 'Link' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
}

export const ExtraSmall: Story = {
  args: { size: 'xs', children: 'Tiny' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
}

export const WithIcon: Story = {
  args: { children: <><Plus /> Add</> },
}

export const IconOnly: Story = {
  args: { size: 'icon', children: <Plus />, 'aria-label': 'Add' },
}

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
}

export const ClickInteraction: Story = {
  args: { children: 'Click me', onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
