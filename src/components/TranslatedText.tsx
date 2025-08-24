import React, { useEffect, useState, ElementType } from 'react';
import { useTranslateText } from '../hooks/useTranslateText';

interface TranslatedTextProps {
  text: string;
  targetLang?: string;
  fallback?: string;
  className?: string;
  as?: ElementType;
  loading?: React.ReactNode;
  [key: string]: any; // Allow other props to be passed through
}

/**
 * Component that automatically translates text based on current language
 */
const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  targetLang,
  fallback = text,
  className = '',
  as: Component = 'span',
  loading = null,
  ...props
}) => {
  const { t, currentLanguage, needsTranslation } = useTranslateText();
  const [translatedText, setTranslatedText] = useState<string>(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateText = async () => {
      // Reset to original text first
      setTranslatedText(text);
      
      // Check if translation is needed
      const target = targetLang || currentLanguage.code;
      if (!needsTranslation(target)) {
        return;
      }

      setIsTranslating(true);

      try {
        const translated = await t(text, target);
        setTranslatedText(translated);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(fallback);
      } finally {
        setIsTranslating(false);
      }
    };

    if (text) {
      translateText();
    }
  }, [text, targetLang, currentLanguage.code, t, fallback, needsTranslation]);

  // Show loading state if specified and currently translating
  if (isTranslating && loading) {
    return <>{loading}</>;
  }

  // Render the translated text with the specified component
  return (
    <Component className={className} {...props}>
      {translatedText}
    </Component>
  );
};

export default TranslatedText;
