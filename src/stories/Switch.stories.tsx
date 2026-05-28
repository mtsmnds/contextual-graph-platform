import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Switch } from '@/components/ui/switch'

/**
 * A labeled toggle with optional description.
 * Label on the left, switch on the right.
 * Use for settings, feature flags, and preferences.
 */
const meta = {
  title: 'Buttons & Sidebar/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    label: { description: 'Label text displayed to the left of the switch.' },
    description: { description: 'Optional helper text shown below the label.' },
    disabled: { description: 'Disables the switch and dims the label.' },
    invalid: { description: 'Shows a red border on the switch and red description text.' },
    checked: { description: 'Controlled checked state.' },
    onCheckedChange: { description: 'Called when the switch is toggled.' },
  },
  args: {
    label: 'Airplane Mode',
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/** Basic toggle with label only. */
export const Default: Story = {}

/** Toggle with additional helper text below the label. */
export const WithDescription: Story = {
  args: {
    label: 'ViewLogger',
    description: 'Shows x, y and zoom in the top-left corner.',
  },
}

/** Toggle that is disabled — the switch is grayed out and cannot be interacted with. */
export const Disabled: Story = {
  args: { disabled: true },
}

/**
 * Toggle in an invalid state.
 * The switch gets a red border and the description text turns red.
 * Use this to indicate a required toggle that hasn't been accepted.
 */
export const Invalid: Story = {
  args: {
    label: 'Accept terms',
    description: 'You must accept the terms to continue.',
    invalid: true,
  },
}
