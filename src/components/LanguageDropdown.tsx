import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/contexts/TranslationContext'

interface LanguageDropdownProps {
  variant?: 'default' | 'landing' | 'sidebar'
}

export default function LanguageDropdown({ variant = 'default' }: LanguageDropdownProps) {
  const { currentLanguage, availableLanguages, setLanguage, isLoading } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLanguageChange = (language: typeof availableLanguages[0]) => {
    if (isLoading) return
    console.log('Changing language to:', language.name)
    setLanguage(language)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const buttonStyles = variant === 'landing' 
    ? "flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white/90 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    : variant === 'sidebar'
    ? "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-sm hover:shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    : "flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  const dropdownStyles = variant === 'landing'
    ? "absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg z-50"
    : variant === 'sidebar'
    ? "absolute left-0 bottom-full mb-2 w-full rounded-md bg-white/98 dark:bg-slate-900/95 shadow-lg ring-1 ring-black/5 z-50"
    : "absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50"

  const itemStyles = variant === 'landing'
    ? "w-full flex items-center justify-between px-4 py-2 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
    : variant === 'sidebar'
    ? "w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
    : "w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonStyles}
        title={isLoading ? "Translating..." : "Change Language"}
        disabled={isLoading}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : variant === 'sidebar' ? (
          <>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2v20" />
              </svg>
              <span className="uppercase">{currentLanguage.code}</span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{currentLanguage.nativeName}</span>
            <svg className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>
      
      {isOpen && (
        <div className={dropdownStyles}>
          <div className={variant === 'sidebar' ? "py-1 max-h-48 overflow-auto" : "py-1"}>
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={variant === 'sidebar' 
                  ? `w-full flex items-center gap-3 px-3 py-2 text-sm ${language.code === currentLanguage.code ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300'} transition-colors disabled:opacity-50`
                  : itemStyles
                }
                disabled={isLoading}
              >
                {variant === 'sidebar' ? (
                  <>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50/40 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[11px] font-medium">
                      {language.code.toUpperCase()}
                    </span>
                    <span className="flex-1">{language.name}</span>
                    {language.code === currentLanguage.code && <span className="text-yellow-500">●</span>}
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{language.code.toUpperCase()}</span>
                      <span className="font-medium">{language.nativeName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {isLoading && currentLanguage.code === language.code && (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {currentLanguage.code === language.code && !isLoading && (
                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
