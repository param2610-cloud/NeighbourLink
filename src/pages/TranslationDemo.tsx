import React, { useState } from 'react';
import GoogleTranslateAPI from '../components/GoogleTranslateAPI';
import TranslatedText from '../components/TranslatedText';
import { useTranslateText } from '../hooks/useTranslateText';
import { translatePage } from '../utils/domTranslator';

const TranslationDemo: React.FC = () => {
  const { t, currentLanguage } = useTranslateText();
  const [inputText, setInputText] = useState('Hello, how are you today?');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateText = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    try {
      const translated = await t(inputText);
      setTranslatedText(translated);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslatePage = async () => {
    try {
      await translatePage(currentLanguage.code);
    } catch (error) {
      console.error('Page translation failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">
          Google Translation API Demo
        </h1>
        <p className="text-lg opacity-90">
          This demo showcases the new Google Translation API implementation without using any widgets.
        </p>
      </div>

      {/* Language Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Language Selector</h2>
        <div className="max-w-xs">
          <GoogleTranslateAPI />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Current Language: <strong>{currentLanguage.name}</strong> ({currentLanguage.code})
        </p>
      </div>

      {/* Manual Text Translation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Text Translation</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter text to translate:
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter text to translate..."
            />
          </div>

          <button
            onClick={handleTranslateText}
            disabled={isTranslating || !inputText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isTranslating && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            Translate Text
          </button>

          {translatedText && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Translation:
              </p>
              <p className="text-lg">{translatedText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Automatic Text Translation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Automatic Text Translation</h2>
        
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Original text:
            </p>
            <p className="text-lg mb-4">
              Welcome to NeighbourLink! This is a community platform for neighbors to connect and help each other.
            </p>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Automatically translated:
            </p>
            <TranslatedText 
              text="Welcome to NeighbourLink! This is a community platform for neighbors to connect and help each other."
              className="text-lg font-medium text-blue-600 dark:text-blue-400"
              loading={
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Translating...</span>
                </div>
              }
            />
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Another example:
            </p>
            <TranslatedText 
              text="Emergency Alert: Please stay safe and contact authorities if needed."
              className="text-lg font-semibold text-red-600 dark:text-red-400"
              as="div"
            />
          </div>
        </div>
      </div>

      {/* Page Translation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Page Translation</h2>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Translate all text content on this page automatically:
          </p>
          
          <button
            onClick={handleTranslatePage}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Translate Entire Page
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note: This will translate all text content except elements marked with data-no-translate attribute.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✓ Pure API Implementation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uses Google Cloud Translation API directly, no widget dependencies.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✓ Translation Caching
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Caches translations to reduce API calls and improve performance.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✓ Automatic Translation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              TranslatedText component automatically translates content based on selected language.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✓ DOM Translation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Utility to translate entire pages or specific DOM elements.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✓ TypeScript Support
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fully typed with TypeScript for better developer experience.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              ✓ RTL Support
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Supports right-to-left languages with automatic direction switching.
            </p>
          </div>
        </div>
      </div>

      {/* Sample Content for Translation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" data-no-translate="false">
        <h2 className="text-xl font-semibold mb-4">Sample Content</h2>
        <div className="space-y-4">
          <p>
            This is sample content that will be translated when you use the "Translate Entire Page" feature.
          </p>
          <p>
            NeighbourLink helps neighbors connect, share resources, and build stronger communities together.
          </p>
          <p>
            You can report emergencies, organize events, offer help, and much more through our platform.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md" data-no-translate="true">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This content has data-no-translate="true" so it won't be translated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationDemo;
