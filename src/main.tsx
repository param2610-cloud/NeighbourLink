import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import PlayGround from './router/PlayGround'
import { StateProvider } from './contexts/StateContext'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StateProvider>

      <PlayGround />
    </StateProvider>
  </React.StrictMode>,
)
