import { useCallback } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

/**
 * Hook for translating text content using Google Translate API
 */
export const useTranslateText = () => {
  const { translateString, currentLanguage, isLoading, error } = useTranslation();

  /**
   * Translate a single text string
   */
  const t = useCallback((text: string, targetLang?: string): Promise<string> => {
    return translateString(text, targetLang);
  }, [translateString]);

  /**
   * Translate an object with text values
   */
  const translateObject = useCallback(async (
    obj: Record<string, string>, 
    targetLang?: string
  ): Promise<Record<string, string>> => {
    const translations: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      translations[key] = await translateString(value, targetLang);
    }
    
    return translations;
  }, [translateString]);

  /**
   * Translate an array of strings
   */
  const translateArray = useCallback(async (
    texts: string[], 
    targetLang?: string
  ): Promise<string[]> => {
    const translations: string[] = [];
    
    for (const text of texts) {
      const translated = await translateString(text, targetLang);
      translations.push(translated);
    }
    
    return translations;
  }, [translateString]);

  /**
   * Get current language info
   */
  const getCurrentLanguage = useCallback(() => currentLanguage, [currentLanguage]);

  /**
   * Check if translation is needed (not English)
   */
  const needsTranslation = useCallback((targetLang?: string): boolean => {
    const target = targetLang || currentLanguage.code;
    return target !== 'en';
  }, [currentLanguage.code]);

  /**
   * Conditionally translate text only if target language is not English
   */
  const conditionalTranslate = useCallback(async (
    text: string, 
    targetLang?: string
  ): Promise<string> => {
    if (!needsTranslation(targetLang)) {
      return text;
    }
    return translateString(text, targetLang);
  }, [translateString, needsTranslation]);

  return {
    t,
    translateObject,
    translateArray,
    conditionalTranslate,
    getCurrentLanguage,
    needsTranslation,
    isLoading,
    error,
    currentLanguage
  };
};
