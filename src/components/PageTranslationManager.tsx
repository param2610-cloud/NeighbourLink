import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { translateText } from '../services/googleTranslateAPI';

/**
 * Page Translation Manager - automatically translates marked content when language changes
 */
export const PageTranslationManager: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const originalTexts = useRef<Map<Element, string>>(new Map());
  const translationCache = useRef<Map<string, Map<string, string>>>(new Map());

  useEffect(() => {
    if (currentLanguage.code === 'en') {
      restoreOriginalTexts();
    } else {
      translatePageContent();
    }
  }, [currentLanguage.code]);

  const findTranslatableElements = (): Element[] => {
    const selectors = [
      'h1, h2, h3, h4, h5, h6', // Headings
      'p', // Paragraphs
      'span:not([class*="icon"]):not([class*="btn"])', // Text spans (exclude icons and buttons)
      'div[class*="text"]:not([class*="btn"])', // Text containers
      '.translatable', // Explicitly marked elements
      '[data-translate="true"]' // Explicitly marked elements
    ].join(', ');

    const elements = Array.from(document.querySelectorAll(selectors));
    
    return elements.filter(element => {
      // Skip if explicitly marked as no-translate
      if (element.hasAttribute('data-no-translate') || 
          element.classList.contains('no-translate') ||
          element.getAttribute('translate') === 'no') {
        return false;
      }

      // Skip if inside excluded containers
      if (element.closest('nav, header, footer, .navigation, .menu, .sidebar, button, a, input, textarea, select, code, pre, script, style')) {
        return false;
      }

      // Skip if text is too short or not meaningful
      const text = element.textContent?.trim();
      if (!text || text.length < 3) {
        return false;
      }

      // Skip technical content
      if (/^[\d\s\W]+$/.test(text) || // Only numbers/symbols
          /^[A-Z_][A-Z0-9_]*$/.test(text) || // Constants
          /^\.[a-zA-Z-]+/.test(text) || // CSS classes
          /#[a-zA-Z0-9-]+/.test(text) || // IDs
          /https?:\/\//.test(text)) { // URLs
        return false;
      }

      return true;
    });
  };

  const translatePageContent = async () => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    
    try {
      const elements = findTranslatableElements();
      const targetLang = currentLanguage.code;
      
      // Get or create cache for this language
      if (!translationCache.current.has(targetLang)) {
        translationCache.current.set(targetLang, new Map());
      }
      const langCache = translationCache.current.get(targetLang)!;

      // Process elements in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < elements.length; i += batchSize) {
        const batch = elements.slice(i, i + batchSize);
        await Promise.all(batch.map(async (element) => {
          const originalText = element.textContent?.trim();
          if (!originalText) return;

          // Store original text if not already stored
          if (!originalTexts.current.has(element)) {
            originalTexts.current.set(element, originalText);
          }

          // Check cache first
          if (langCache.has(originalText)) {
            element.textContent = langCache.get(originalText)!;
            return;
          }

          try {
            const result = await translateText({
              text: originalText,
              targetLanguage: targetLang,
              sourceLanguage: 'en'
            });

            const translatedText = result.translatedText;
            langCache.set(originalText, translatedText);
            element.textContent = translatedText;
          } catch (error) {
            console.warn('Failed to translate text:', originalText, error);
            // Keep original text on error
          }
        }));

        // Add small delay between batches to avoid rate limiting
        if (i + batchSize < elements.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('Page translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const restoreOriginalTexts = () => {
    originalTexts.current.forEach((originalText, element) => {
      if (element.isConnected) { // Check if element is still in DOM
        element.textContent = originalText;
      }
    });
  };

  // Render loading indicator
  if (isTranslating) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-blue-400">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Translating to {currentLanguage.nativeName}</span>
          <span className="text-xs opacity-90">Please wait...</span>
        </div>
      </div>
    );
  }

  return null;
};

export default PageTranslationManager;
