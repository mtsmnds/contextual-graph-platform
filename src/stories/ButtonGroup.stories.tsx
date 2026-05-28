import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import { ArrowUUpLeft, ArrowUUpRight, Plus, FolderOpen } from '@phosphor-icons/react'

const meta = {
  title: 'Buttons & Sidebar/ButtonGroup',
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

export const WithIconButtons: Story = {
  render: () => (
    <ButtonGroup>
      <IconButton aria-label="Undo"><ArrowUUpLeft /></IconButton>
      <IconButton aria-label="Redo"><ArrowUUpRight /></IconButton>
      <ButtonGroupSeparator />
      <IconButton aria-label="Open" variant="outline"><FolderOpen /></IconButton>
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
