import React from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import PlayGround from './router/PlayGround'
import { StateProvider } from './contexts/StateContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { MobileProvider } from './contexts/MobileContext'
import { TranslationProvider } from '@/contexts/TranslationContext'
import PageTranslationManager from '@/components/PageTranslationManager'
import { Analytics } from "@vercel/analytics/react"

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StateProvider>
      <ThemeProvider>
        <TranslationProvider>
          <MobileProvider>
            <PlayGround />
            <PageTranslationManager />
            <Analytics/>
          </MobileProvider>
        </TranslationProvider>
      </ThemeProvider>
    </StateProvider>
  </React.StrictMode>,
)
