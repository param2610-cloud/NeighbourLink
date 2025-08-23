import React, { useState, useEffect } from 'react';
import { getGoogleTranslateDebugInfo, logGoogleTranslateDebugInfo, resetGoogleTranslateToEnglish, type GoogleTranslateDebugInfo } from '@/utils/googleTranslateDebug';

interface GoogleTranslateDebugPanelProps {
  enabled?: boolean;
}

/**
 * Debug panel for Google Translate - only use in development
 */
export const GoogleTranslateDebugPanel: React.FC<GoogleTranslateDebugPanelProps> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [debugInfo, setDebugInfo] = useState<GoogleTranslateDebugInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    
    const updateDebugInfo = () => {
      setDebugInfo(getGoogleTranslateDebugInfo());
    };

    // Update initially
    updateDebugInfo();

    // Update every 2 seconds
    const interval = setInterval(updateDebugInfo, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 px-3 py-1 bg-blue-500 text-white text-xs rounded shadow hover:bg-blue-600"
      >
        🌐 GT Debug {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="w-80 p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-lg text-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Google Translate Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <strong>Current Language:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.currentLanguage === 'en' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {debugInfo.currentLanguage.toUpperCase()}
              </span>
            </div>
            
            <div>
              <strong>Script Loaded:</strong>
              <span className={`ml-2 ${debugInfo.scriptLoaded ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.scriptLoaded ? '✓' : '✗'}
              </span>
            </div>
            
            <div>
              <strong>Element Exists:</strong>
              <span className={`ml-2 ${debugInfo.elementExists ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.elementExists ? '✓' : '✗'}
              </span>
            </div>
            
            <div>
              <strong>Cookie Value:</strong>
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 break-all">
                {debugInfo.cookieValue || 'null'}
              </div>
            </div>
            
            {debugInfo.cookieParsed && (
              <div>
                <strong>Parsed:</strong>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                  {debugInfo.cookieParsed.source} → {debugInfo.cookieParsed.target}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={logGoogleTranslateDebugInfo}
              className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Log to Console
            </button>
            <button
              onClick={resetGoogleTranslateToEnglish}
              className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Reset to EN
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Auto-refreshes every 2s
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslateDebugPanel;
