import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

const GoogleTranslateAPI: React.FC = () => {
  const { 
    currentLanguage, 
    availableLanguages, 
    setLanguage, 
    isLoading,
    error 
  } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (language: typeof availableLanguages[0]) => {
    setLanguage(language);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-sm hover:shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={isLoading}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="uppercase font-semibold">{currentLanguage.code}</span>
          <span className="text-xs opacity-90 truncate max-w-20">
            {currentLanguage.nativeName}
          </span>
          {isLoading && (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md shadow-sm z-50">
          Translation error: {error}
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-full rounded-lg bg-white/98 dark:bg-slate-900/95 shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-50 max-h-80 overflow-hidden">
          <div className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              Select Language
            </div>
            <div className="max-h-64 overflow-y-auto">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-150 ${
                    language.code === currentLanguage.code
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  type="button"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                    {language.code.toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{language.name}</div>
                    <div className="text-xs opacity-70">{language.nativeName}</div>
                  </div>
                  {language.code === currentLanguage.code && (
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
              Powered by Google Translate API
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslateAPI;
