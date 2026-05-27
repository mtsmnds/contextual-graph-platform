import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import { ArrowUUpLeft, ArrowUUpRight, Plus } from '@phosphor-icons/react'

const meta = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const HorizontalButtons: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline" size="sm"><ArrowUUpLeft /></Button>
      <Button variant="outline" size="sm"><ArrowUUpRight /></Button>
    </ButtonGroup>
  ),
}

export const WithSeparator: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline" size="sm"><ArrowUUpLeft /></Button>
      <Button variant="outline" size="sm"><ArrowUUpRight /></Button>
      <ButtonGroupSeparator />
      <Button variant="outline" size="sm"><Plus /></Button>
    </ButtonGroup>
  ),
}

export const WithTextGroup: Story = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>items: 3</ButtonGroupText>
      <ButtonGroupSeparator />
      <Button variant="outline" size="sm"><Plus /></Button>
    </ButtonGroup>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline" size="sm">Top</Button>
      <Button variant="outline" size="sm">Middle</Button>
      <Button variant="outline" size="sm">Bottom</Button>
    </ButtonGroup>
  ),
}
