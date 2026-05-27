import type { Preview } from '@storybook/react-vite'
import { BrowserRouter } from 'react-router-dom'

import '@/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    }
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="dark">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
}

export default preview
