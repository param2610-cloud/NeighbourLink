import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translateText } from '../services/googleTranslateAPI';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export interface TranslationContextType {
  currentLanguage: Language;
  availableLanguages: Language[];
  isLoading: boolean;
  error: string | null;
  translateString: (text: string, targetLang?: string) => Promise<string>;
  setLanguage: (language: Language) => void;
  translationCache: Map<string, string>;
  clearCache: () => void;
}

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', direction: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', direction: 'ltr' },
];

const TranslationContext = createContext<TranslationContextType | null>(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(supportedLanguages[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationCache] = useState<Map<string, string>>(new Map());

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguageCode = localStorage.getItem('selectedLanguage');
    if (savedLanguageCode) {
      const savedLanguage = supportedLanguages.find(lang => lang.code === savedLanguageCode);
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
        updateDocumentDirection(savedLanguage.direction);
      }
    }
  }, []);

  const updateDocumentDirection = (direction: 'ltr' | 'rtl') => {
    const htmlElement = document.documentElement;
    htmlElement.dir = direction;
    htmlElement.setAttribute('lang', currentLanguage.code);
    
    if (direction === 'rtl') {
      htmlElement.classList.add('rtl');
      htmlElement.classList.remove('ltr');
    } else {
      htmlElement.classList.add('ltr');
      htmlElement.classList.remove('rtl');
    }
  };

  const translateString = useCallback(async (
    text: string, 
    targetLang?: string
  ): Promise<string> => {
    const target = targetLang || currentLanguage.code;
    
    // Return original text if target is English or same as current
    if (target === 'en' || !text.trim()) {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}:${target}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await translateText({
        text: text,
        targetLanguage: target,
        sourceLanguage: 'en' // Assuming source is always English
      });

      const translatedText = result.translatedText;
      
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      console.error('Translation error:', err);
      
      // Return original text on error
      return text;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage.code, translationCache]);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('selectedLanguage', language.code);
    updateDocumentDirection(language.direction);
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    translationCache.clear();
  }, [translationCache]);

  const contextValue: TranslationContextType = {
    currentLanguage,
    availableLanguages: supportedLanguages,
    isLoading,
    error,
    translateString,
    setLanguage,
    translationCache,
    clearCache,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};
