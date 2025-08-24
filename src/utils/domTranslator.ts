import { translateText } from '../services/googleTranslateAPI';

/**
 * Utility for translating DOM text content
 */

export interface DOMTranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
  excludeSelectors?: string[];
  includeSelectors?: string[];
  preserveHTML?: boolean;
  batchSize?: number;
}

export class DOMTranslator {
  private translationCache = new Map<string, string>();
  private isTranslating = false;

  /**
   * Translate all text content in a DOM element
   */
  async translateElement(
    element: HTMLElement, 
    options: DOMTranslationOptions
  ): Promise<void> {
    if (this.isTranslating) {
      console.warn('Translation already in progress');
      return;
    }

    this.isTranslating = true;

    try {
      const textNodes = this.getTextNodes(element, options);
      await this.translateTextNodes(textNodes, options);
    } catch (error) {
      console.error('DOM Translation Error:', error);
      throw error;
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Translate the entire document
   */
  async translateDocument(options: DOMTranslationOptions): Promise<void> {
    await this.translateElement(document.body, options);
  }

  /**
   * Get all text nodes that should be translated
   */
  private getTextNodes(
    element: HTMLElement, 
    options: DOMTranslationOptions
  ): { node: Text; text: string }[] {
    const textNodes: { node: Text; text: string }[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parentElement = node.parentElement;
          if (!parentElement) return NodeFilter.FILTER_REJECT;

          // Skip if parent matches exclude selectors
          if (options.excludeSelectors?.some(selector => 
            parentElement.matches(selector)
          )) {
            return NodeFilter.FILTER_REJECT;
          }

          // If include selectors specified, only include matching elements
          if (options.includeSelectors?.length && 
              !options.includeSelectors.some(selector => 
                parentElement.matches(selector)
              )) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip certain elements
          const tagName = parentElement.tagName.toLowerCase();
          if ([
            'script', 'style', 'code', 'pre', 'noscript', 
            'input', 'textarea', 'button', 'select', 'option',
            'meta', 'title', 'link'
          ].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if parent has contenteditable
          if (parentElement.hasAttribute('contenteditable')) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if parent has specific data attributes or classes
          if (parentElement.hasAttribute('data-no-translate') || 
              parentElement.classList.contains('no-translate') ||
              parentElement.hasAttribute('translate') && parentElement.getAttribute('translate') === 'no') {
            return NodeFilter.FILTER_REJECT;
          }

          const text = node.textContent?.trim();
          if (!text || text.length < 3) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if text is only numbers, symbols, or very short words
          if (/^[\d\s\W]+$/.test(text) || /^[a-zA-Z]{1,2}$/.test(text)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if text looks like code or technical content
          if (/^[A-Z_][A-Z0-9_]*$/.test(text) || // Constants
              /^\.[a-zA-Z-]+/.test(text) || // CSS classes
              /#[a-zA-Z0-9-]+/.test(text) || // IDs or hashtags
              /https?:\/\//.test(text)) { // URLs
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const text = textNode.textContent?.trim();
      if (text) {
        textNodes.push({ node: textNode, text });
      }
    }

    return textNodes;
  }

  /**
   * Translate text nodes in batches
   */
  private async translateTextNodes(
    textNodes: { node: Text; text: string }[], 
    options: DOMTranslationOptions
  ): Promise<void> {
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      await this.translateBatch(batch, options);
    }
  }

  /**
   * Translate a batch of text nodes
   */
  private async translateBatch(
    batch: { node: Text; text: string }[], 
    options: DOMTranslationOptions
  ): Promise<void> {
    const textsToTranslate = batch
      .filter(({ text }) => !this.translationCache.has(text))
      .map(({ text }) => text);

    if (textsToTranslate.length === 0) {
      // All texts are cached, apply cached translations
      batch.forEach(({ node, text }) => {
        const cached = this.translationCache.get(text);
        if (cached) {
          node.textContent = cached;
        }
      });
      return;
    }

    try {
      const translations = await this.batchTranslate(
        textsToTranslate, 
        options.targetLanguage,
        options.sourceLanguage
      );

      // Cache new translations
      textsToTranslate.forEach((text, index) => {
        this.translationCache.set(text, translations[index]);
      });

      // Apply all translations (cached + new)
      batch.forEach(({ node, text }) => {
        const translation = this.translationCache.get(text);
        if (translation) {
          node.textContent = translation;
        }
      });
    } catch (error) {
      console.error('Batch translation failed:', error);
      // Don't modify nodes on error
    }
  }

  /**
   * Translate multiple texts using the API
   */
  private async batchTranslate(
    texts: string[], 
    targetLanguage: string,
    sourceLanguage = 'auto'
  ): Promise<string[]> {
    const translations: string[] = [];

    // Translate texts one by one (API doesn't support true batch translation)
    for (const text of texts) {
      try {
        const result = await translateText({
          text,
          targetLanguage,
          sourceLanguage
        });
        translations.push(result.translatedText);
      } catch (error) {
        console.error(`Failed to translate: "${text}"`, error);
        translations.push(text); // Use original text on error
      }
    }

    return translations;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.translationCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.translationCache.size;
  }
}

// Export a singleton instance
export const domTranslator = new DOMTranslator();

/**
 * Convenience function to translate the entire page
 */
export async function translatePage(
  targetLanguage: string,
  options?: Partial<DOMTranslationOptions>
): Promise<void> {
  const defaultOptions: DOMTranslationOptions = {
    targetLanguage,
    sourceLanguage: 'auto',
    excludeSelectors: [
      '[data-no-translate]',
      '.no-translate',
      '[translate="no"]',
      'code',
      'pre',
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.navigation',
      '.menu',
      '.sidebar',
      '.google-translate-container',
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'textarea',
      'button',
      'select',
      '[contenteditable]',
      '.btn',
      '.button',
      'a[href]'
    ],
    batchSize: 3, // Smaller batch for better performance
    ...options
  };

  await domTranslator.translateDocument(defaultOptions);
}

/**
 * Convenience function to translate a specific element
 */
export async function translateElementById(
  elementId: string,
  targetLanguage: string,
  options?: Partial<DOMTranslationOptions>
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const defaultOptions: DOMTranslationOptions = {
    targetLanguage,
    sourceLanguage: 'auto',
    excludeSelectors: [
      '[data-no-translate]',
      '.no-translate',
      '[translate="no"]'
    ],
    batchSize: 5,
    ...options
  };

  await domTranslator.translateElement(element as HTMLElement, defaultOptions);
}
