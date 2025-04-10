import React from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import PlayGround from './router/PlayGround'
import { StateProvider } from './contexts/StateContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { MobileProvider } from './contexts/MobileContext'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StateProvider>
      <ThemeProvider>
        <MobileProvider>
          <PlayGround />
        </MobileProvider>
      </ThemeProvider>
    </StateProvider>
  </React.StrictMode>,
)
