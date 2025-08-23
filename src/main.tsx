import React from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import PlayGround from './router/PlayGround'
import { StateProvider } from './contexts/StateContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { MobileProvider } from './contexts/MobileContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Analytics } from "@vercel/analytics/react"

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StateProvider>
      <ThemeProvider>
        <LanguageProvider>
          <MobileProvider>
            <PlayGround />
            <Analytics/>
            {/* Hidden Google Translate Element */}
            <div id="google_translate_element" style={{ display: 'none' }}></div>
          </MobileProvider>
        </LanguageProvider>
      </ThemeProvider>
    </StateProvider>
  </React.StrictMode>,
)
