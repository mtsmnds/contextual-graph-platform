import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Input } from '@/components/ui/input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'url'],
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: 'Type something...' },
}

export const WithValue: Story = {
  args: { defaultValue: 'Hello world' },
}

export const Password: Story = {
  args: { type: 'password', defaultValue: 'secret123' },
}

export const Disabled: Story = {
  args: { placeholder: 'Disabled input', disabled: true },
}

export const WithError: Story = {
  args: { placeholder: 'Invalid input', 'aria-invalid': true },
}

export const TypeInteraction: Story = {
  args: { placeholder: 'Type here...' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('Type here...')
    await userEvent.type(input, 'Hello Storybook')
    await expect(input).toHaveValue('Hello Storybook')
  },
}
