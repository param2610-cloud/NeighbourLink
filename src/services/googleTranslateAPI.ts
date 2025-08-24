/**
 * Google Translate API Service
 * Uses Google Cloud Translation API for text translation
 */

const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const API_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslationRequest {
  text: string | string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface DetectedLanguage {
  language: string;
  confidence: number;
}

export interface SupportedLanguage {
  language: string;
  name: string;
}

/**
 * Translate text using Google Translate API
 */
export async function translateText({
  text,
  targetLanguage,
  sourceLanguage = 'auto'
}: TranslationRequest): Promise<TranslationResponse> {
  if (!API_KEY) {
    throw new Error('Google Translate API key not configured');
  }

  const textArray = Array.isArray(text) ? text : [text];

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: textArray,
        target: targetLanguage,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        format: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Translation failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.translations || data.data.translations.length === 0) {
      throw new Error('Invalid response from Google Translate API');
    }

    const translation = data.data.translations[0];
    
    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage
    };
  } catch (error) {
    console.error('Google Translate API Error:', error);
    throw error;
  }
}

/**
 * Detect the language of the given text
 */
export async function detectLanguage(text: string): Promise<DetectedLanguage> {
  if (!API_KEY) {
    throw new Error('Google Translate API key not configured');
  }

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: [text]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Language detection failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.detections || data.data.detections.length === 0) {
      throw new Error('Invalid response from Google Translate API');
    }

    const detection = data.data.detections[0][0];
    
    return {
      language: detection.language,
      confidence: detection.confidence
    };
  } catch (error) {
    console.error('Language Detection Error:', error);
    throw error;
  }
}

/**
 * Get list of supported languages
 */
export async function getSupportedLanguages(targetLanguage = 'en'): Promise<SupportedLanguage[]> {
  if (!API_KEY) {
    throw new Error('Google Translate API key not configured');
  }

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?key=${API_KEY}&target=${targetLanguage}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to get supported languages: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.languages) {
      throw new Error('Invalid response from Google Translate API');
    }

    return data.data.languages.map((lang: any) => ({
      language: lang.language,
      name: lang.name
    }));
  } catch (error) {
    console.error('Get Supported Languages Error:', error);
    throw error;
  }
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(
  texts: string[],
  targetLanguage: string,
  sourceLanguage = 'auto'
): Promise<TranslationResponse[]> {
  if (!API_KEY) {
    throw new Error('Google Translate API key not configured');
  }

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        target: targetLanguage,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        format: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Batch translation failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.translations) {
      throw new Error('Invalid response from Google Translate API');
    }

    return data.data.translations.map((translation: any) => ({
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage
    }));
  } catch (error) {
    console.error('Batch Translation Error:', error);
    throw error;
  }
}
