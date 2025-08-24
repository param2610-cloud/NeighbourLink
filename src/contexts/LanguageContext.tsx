import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

export interface Language {
  code: string
  name: string
  flag: string
  direction: 'ltr' | 'rtl'
}

export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳', direction: 'ltr' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', direction: 'ltr' },
]

interface LanguageContextType {
  currentLanguage: Language
  setCurrentLanguage: (language: Language) => void
  isTranslating: boolean
  scriptLoaded: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(supportedLanguages[0])
  const [isTranslating, setIsTranslating] = useState(false)
  const scriptLoaded = useRef(false)
  const translateElementInitialized = useRef(false)

  // Initialize Google Translate on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadGoogleTranslateScript = () => {
      // Check if script is already loaded
      if (scriptLoaded.current || document.querySelector('script[src*="translate.google.com"]')) {
        return
      }

      // Initialize the callback function
      ;(window as any).googleTranslateElementInit = () => {
        try {
          if ((window as any).google?.translate?.TranslateElement && !translateElementInitialized.current) {
            new (window as any).google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,hi,pa,bn',
              layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true
            }, 'google_translate_element')
            
            translateElementInitialized.current = true
            console.log('Google Translate widget initialized successfully')
          }
        } catch (error) {
          console.error('Error initializing Google Translate widget:', error)
        }
      }

      // Load the Google Translate script
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        scriptLoaded.current = true
        console.log('Google Translate script loaded successfully')
      }
      
      script.onerror = (error) => {
        console.error('Failed to load Google Translate script:', error)
      }
      
      document.head.appendChild(script)
    }

    // Load the script
    loadGoogleTranslateScript()

    // Check for existing translation state from URL hash
    const checkCurrentTranslation = () => {
      const hash = window.location.hash
      if (hash.includes('#googtrans(')) {
        const match = hash.match(/#googtrans\(en\|(\w+)\)/)
        if (match) {
          const langCode = match[1]
          const language = supportedLanguages.find(lang => lang.code === langCode)
          if (language) {
            setCurrentLanguage(language)
            updateDocumentDirection(language.direction)
            return
          }
        }
      }
      
      // Don't auto-apply saved language to prevent reversion issues
      // Just set the UI to show the saved preference without translating
      const savedLanguage = localStorage.getItem('preferredLanguage')
      if (savedLanguage && savedLanguage !== 'en') {
        const language = supportedLanguages.find(lang => lang.code === savedLanguage)
        if (language) {
          setCurrentLanguage(language)
          // Don't call updateDocumentDirection or triggerTranslation here
          return
        }
      }
      
      // Default to English
      setCurrentLanguage(supportedLanguages[0])
      updateDocumentDirection('ltr')
    }

    checkCurrentTranslation()
  }, [])

  const updateDocumentDirection = (direction: 'ltr' | 'rtl') => {
    const htmlElement = document.documentElement
    htmlElement.dir = direction
    
    if (direction === 'rtl') {
      htmlElement.classList.add('translated-rtl')
      htmlElement.classList.remove('translated-ltr')
    } else {
      htmlElement.classList.add('translated-ltr')
      htmlElement.classList.remove('translated-rtl')
    }
  }

  const triggerTranslation = (targetLanguage: string) => {
    if (targetLanguage === 'en') {
      // Reset to English - comprehensive reset to prevent reversion
      console.log('Resetting to English...')
      
      // Update direction immediately
      updateDocumentDirection('ltr')
      
      // Clear all Google Translate data immediately
      clearGoogleTranslateData()
      
      // Clear the hash immediately
      window.location.hash = ''
      
      // Force complete page reload without any Google Translate parameters
      setTimeout(() => {
        // Construct clean URL without any Google Translate artifacts
        const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.search}`
        
        // Use location.replace to prevent back button issues and ensure clean reload
        window.location.replace(baseUrl)
      }, 50) // Reduced timeout for immediate action
    } else {
      // Apply translation
      console.log(`Translating to ${targetLanguage}...`)
      updateDocumentDirection(supportedLanguages.find(lang => lang.code === targetLanguage)?.direction || 'ltr')
      
      // Set Google Translate hash for translation
      window.location.hash = `#googtrans(en|${targetLanguage})`
      
      // Force page reload to apply translation
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  const clearGoogleTranslateData = () => {
    try {
      // Clear Google Translate cookies more thoroughly
      const cookiesToClear = ['googtrans', 'google_translate_element']
      cookiesToClear.forEach(cookieName => {
        // Clear for current domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
        
        // Clear for Google domains
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.google.com`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.translate.google.com`
      })
      
      // Clear all cookies that contain googtrans
      const cookies = document.cookie.split(";")
      cookies.forEach(function(c) { 
        if (c.indexOf("googtrans") !== -1 || c.indexOf("google_translate") !== -1) {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname
        }
      })
      
      // Clear localStorage items related to Google Translate
      Object.keys(localStorage).forEach(key => {
        if (key.includes('googtrans') || key.includes('google_translate')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage items related to Google Translate
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('googtrans') || key.includes('google_translate')) {
          sessionStorage.removeItem(key)
        }
      })
      
      // Remove Google Translate specific DOM elements that might cause reversion
      const elementsToRemove = [
        '.goog-te-banner-frame',
        '.goog-te-menu-frame', 
        '.skiptranslate',
        '.goog-te-ftab',
        '[class*="goog-te-"]'
      ]
      
      elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          if (!el.closest('#google_translate_element')) {
            el.remove()
          }
        })
      })
      
      console.log('Google Translate data cleared thoroughly')
    } catch (error) {
      console.log('Error clearing Google Translate data:', error)
    }
  }

  const changeLanguage = (language: Language) => {
    if (isTranslating) return

    console.log('Changing language to:', language.name, language.code)
    setIsTranslating(true)
    setCurrentLanguage(language)

    // Save or clear preference to localStorage
    if (language.code === 'en') {
      // Clear preference for English to prevent reversion
      localStorage.removeItem('preferredLanguage')
    } else {
      localStorage.setItem('preferredLanguage', language.code)
    }

    // Trigger the translation
    triggerTranslation(language.code)
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage: changeLanguage,
        isTranslating,
        scriptLoaded: scriptLoaded.current,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
