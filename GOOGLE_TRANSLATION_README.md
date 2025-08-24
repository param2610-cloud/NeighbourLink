# Google Translation API Implementation

This implementation provides a complete Google Translation API solution for React applications, replacing Google Translate Widget with a pure API-based approach.

## Features

- ✅ **Pure API Implementation** - No widget dependencies
- ✅ **Translation Caching** - Reduces API calls and improves performance  
- ✅ **Automatic Translation** - Components that translate content automatically
- ✅ **DOM Translation** - Translate entire pages or specific elements
- ✅ **TypeScript Support** - Fully typed for better developer experience
- ✅ **RTL Support** - Automatic direction switching for right-to-left languages
- ✅ **Error Handling** - Graceful fallbacks and error management
- ✅ **Batch Translation** - Efficient bulk translation support

## Setup

### 1. Environment Variables

Add your Google Translate API key to `.env`:

```env
VITE_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

### 2. Provider Setup

Wrap your app with the `TranslationProvider`:

```tsx
import { TranslationProvider } from '@/contexts/TranslationContext';

function App() {
  return (
    <TranslationProvider>
      {/* Your app content */}
    </TranslationProvider>
  );
}
```

## Usage

### Language Selector Component

Use the `GoogleTranslateAPI` component to let users select languages:

```tsx
import GoogleTranslateAPI from '@/components/GoogleTranslateAPI';

function MyComponent() {
  return (
    <div>
      <GoogleTranslateAPI />
    </div>
  );
}
```

### Automatic Text Translation

Use the `TranslatedText` component for automatic translation:

```tsx
import TranslatedText from '@/components/TranslatedText';

function MyComponent() {
  return (
    <div>
      <TranslatedText 
        text="Hello, welcome to our app!"
        className="text-lg font-bold"
        loading={<span>Translating...</span>}
      />
    </div>
  );
}
```

### Manual Translation Hook

Use the `useTranslateText` hook for manual translation:

```tsx
import { useTranslateText } from '@/hooks/useTranslateText';

function MyComponent() {
  const { t, currentLanguage, isLoading } = useTranslateText();
  const [translatedText, setTranslatedText] = useState('');

  const handleTranslate = async () => {
    const result = await t('Hello world');
    setTranslatedText(result);
  };

  return (
    <div>
      <button onClick={handleTranslate} disabled={isLoading}>
        Translate
      </button>
      <p>{translatedText}</p>
    </div>
  );
}
```

### DOM Translation

Translate entire pages or specific elements:

```tsx
import { translatePage, translateElementById } from '@/utils/domTranslator';

// Translate entire page
await translatePage('hi', {
  excludeSelectors: ['.no-translate', '[data-no-translate]'],
  batchSize: 5
});

// Translate specific element
await translateElementById('content', 'hi');
```

### Translation Context

Access translation context directly:

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

function MyComponent() {
  const { 
    currentLanguage, 
    availableLanguages, 
    setLanguage, 
    isLoading,
    error,
    clearCache
  } = useTranslation();

  return (
    <div>
      <select onChange={(e) => {
        const lang = availableLanguages.find(l => l.code === e.target.value);
        if (lang) setLanguage(lang);
      }}>
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Supported Languages

The implementation supports these languages by default:

- English (en)
- Hindi (hi) - हिन्दी
- Punjabi (pa) - ਪੰਜਾਬੀ
- Bengali (bn) - বাংলা
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Kannada (kn) - ಕನ್ನಡ
- Malayalam (ml) - മലയാളം
- Gujarati (gu) - ગુજરાતી
- Marathi (mr) - मराठी
- Odia (or) - ଓଡ଼ିଆ
- Urdu (ur) - اردو
- Assamese (as) - অসমীয়া

You can modify the supported languages in `src/contexts/TranslationContext.tsx`.

## API Reference

### TranslationProvider Props

```tsx
interface TranslationProviderProps {
  children: ReactNode;
}
```

### useTranslation Hook

```tsx
interface TranslationContextType {
  currentLanguage: Language;
  availableLanguages: Language[];
  isLoading: boolean;
  error: string | null;
  translateString: (text: string, targetLang?: string) => Promise<string>;
  setLanguage: (language: Language) => void;
  translationCache: Map<string, string>;
  clearCache: () => void;
}
```

### useTranslateText Hook

```tsx
interface UseTranslateTextReturn {
  t: (text: string, targetLang?: string) => Promise<string>;
  translateObject: (obj: Record<string, string>, targetLang?: string) => Promise<Record<string, string>>;
  translateArray: (texts: string[], targetLang?: string) => Promise<string[]>;
  conditionalTranslate: (text: string, targetLang?: string) => Promise<string>;
  getCurrentLanguage: () => Language;
  needsTranslation: (targetLang?: string) => boolean;
  isLoading: boolean;
  error: string | null;
  currentLanguage: Language;
}
```

### TranslatedText Component Props

```tsx
interface TranslatedTextProps {
  text: string;
  targetLang?: string;
  fallback?: string;
  className?: string;
  as?: ElementType;
  loading?: React.ReactNode;
  [key: string]: any;
}
```

### DOM Translation Options

```tsx
interface DOMTranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
  excludeSelectors?: string[];
  includeSelectors?: string[];
  preserveHTML?: boolean;
  batchSize?: number;
}
```

## Performance Optimization

### Translation Caching

- Translations are automatically cached to reduce API calls
- Cache persists during the session
- Clear cache with `clearCache()` method

### Batch Processing

- DOM translation processes texts in batches (default: 5)
- Configurable batch size for optimal performance
- Error handling for individual translation failures

### Selective Translation

- Skip elements with `data-no-translate` attribute
- Exclude specific selectors
- Include only specific selectors

## Error Handling

The implementation includes comprehensive error handling:

- **API Errors**: Graceful fallbacks to original text
- **Network Errors**: Retry mechanisms and user feedback
- **Invalid Responses**: Error logging and fallback content
- **Missing API Key**: Clear error messages

## Demo

Access the translation demo at `/translation-demo` to see all features in action.

## Migration from Google Translate Widget

If you're migrating from Google Translate Widget:

1. Remove all widget-related scripts and CSS
2. Replace widget initialization with `TranslationProvider`
3. Replace widget selectors with new components
4. Update language change handlers to use new API
5. Remove widget-specific styling and DOM manipulation

## API Costs

Google Translate API charges per character translated:
- First 500K characters/month: Free
- Additional characters: $20 per 1M characters

Caching significantly reduces costs by avoiding repeated translations.

## Contributing

When adding new features:

1. Update TypeScript interfaces
2. Add proper error handling
3. Include tests for new functionality
4. Update documentation
5. Ensure RTL language support

## License

This implementation is part of the NeighbourLink project.
