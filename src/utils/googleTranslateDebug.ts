/**
 * Utility functions for debugging Google Translate issues
 */

export interface GoogleTranslateDebugInfo {
  cookieValue: string | null;
  cookieParsed: {
    source: string;
    target: string;
  } | null;
  scriptLoaded: boolean;
  elementExists: boolean;
  currentLanguage: string;
}

/**
 * Get debug information about the current Google Translate state
 */
export function getGoogleTranslateDebugInfo(): GoogleTranslateDebugInfo {
  // Get cookie value
  const cookieValue = document.cookie
    .split(";")
    .map(c => c.trim())
    .filter(c => c.startsWith("googtrans="))[0]
    ?.split("=")[1];

  // Parse cookie
  let cookieParsed = null;
  if (cookieValue) {
    try {
      const decoded = decodeURIComponent(cookieValue);
      const parts = decoded.split("/");
      if (parts.length >= 3) {
        cookieParsed = {
          source: parts[1] || "auto",
          target: parts[2] || "en"
        };
      }
    } catch (e) {
      console.warn("Failed to parse googtrans cookie:", e);
    }
  }

  // Check if script is loaded
  const scriptLoaded = !!(window as any)?.google?.translate?.TranslateElement;

  // Check if element exists
  const elementExists = !!document.getElementById("google_translate_element");

  // Get current language from cookie or default to English
  const currentLanguage = cookieParsed?.target || "en";

  return {
    cookieValue,
    cookieParsed,
    scriptLoaded,
    elementExists,
    currentLanguage
  };
}

/**
 * Reset Google Translate to English and clear all cookies
 */
export function resetGoogleTranslateToEnglish(): void {
  // Clear all possible cookie variations
  const cookieNames = ["googtrans"];
  const domains = ["", `.${location.hostname}`, location.hostname];
  const paths = ["/", ""];

  cookieNames.forEach(name => {
    domains.forEach(domain => {
      paths.forEach(path => {
        try {
          const cookieStr = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=${path}${domain ? `; domain=${domain}` : ""}`;
          document.cookie = cookieStr;
        } catch (e) {
          // Ignore errors for invalid domain/path combinations
        }
      });
    });
  });

  // Reload the page to apply changes
  window.location.reload();
}

/**
 * Log debug information to console
 */
export function logGoogleTranslateDebugInfo(): void {
  const info = getGoogleTranslateDebugInfo();
  console.group("🌐 Google Translate Debug Info");
  console.log("Cookie Value:", info.cookieValue);
  console.log("Parsed Cookie:", info.cookieParsed);
  console.log("Script Loaded:", info.scriptLoaded);
  console.log("Element Exists:", info.elementExists);
  console.log("Current Language:", info.currentLanguage);
  console.groupEnd();
}

/**
 * Monitor Google Translate network requests (for debugging purposes)
 * This helps identify when the telemetry requests are being made
 */
export function monitorGoogleTranslateRequests(): void {
  if (typeof window === "undefined") return;

  // Override fetch to monitor requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [resource, config] = args;
    
    // Extract URL from different resource types
    let url: string;
    if (typeof resource === "string") {
      url = resource;
    } else if (resource instanceof URL) {
      url = resource.toString();
    } else if (resource instanceof Request) {
      url = resource.url;
    } else {
      url = String(resource);
    }
    
    // Check if it's a Google Translate related request
    if (url.includes("translate.google") || url.includes("translate.googleapis.com")) {
      console.log("🌐 Google Translate Request:", {
        url,
        method: config?.method || "GET",
        timestamp: new Date().toISOString()
      });
    }
    
    return originalFetch.apply(this, args);
  };

  console.log("🌐 Google Translate request monitoring enabled");
}
