declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

import { useEffect, useState, useRef } from "react";

const LANGS: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  pa: "ਪੰਜਾਬੀ",
  bn: "বাংলা",
};

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  return document.cookie.split(";").map(c => c.trim()).filter(c => c.startsWith(name + "="))[0]?.split("=")[1];
}

function clearGoogtransCookie() {
  // Clear cookie for current path and domain
  document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  // Also try to clear for domain variants
  try {
    const host = location.hostname;
    document.cookie = `googtrans=; domain=.${host}; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    document.cookie = `googtrans=; domain=${host}; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  } catch (e) {
    // Ignore domain errors
  }
}

const GoogleTranslate = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>("en");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // read current language from googtrans cookie if present
    try {
      const raw = getCookie("googtrans");
      if (raw) {
        const val = decodeURIComponent(raw);
        // format is "/source/target" or "/auto/target"
        const parts = val.split("/");
        const lang = parts[2];
        if (lang && LANGS[lang]) {
          setCurrent(lang);
        }
      }
    } catch (e) {
      console.warn('Failed to read language cookie:', e);
    }

    // Prevent double initialization
    if (initializedRef.current) return;
    
    const existingScript = document.getElementById("google-translate-script");
    if (existingScript) {
      setScriptLoaded(true);
      initializedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    
    script.onerror = () => {
      console.error('Failed to load Google Translate script');
      setScriptLoaded(false);
    };
    
    document.body.appendChild(script);

    // expose callback
    (window as any).googleTranslateElementInit = () => {
      try {
        // Ensure we don't initialize multiple times
        const existingElement = document.querySelector('#google_translate_element .goog-te-combo');
        if (existingElement) {
          setScriptLoaded(true);
          initializedRef.current = true;
          return;
        }

        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: Object.keys(LANGS).join(","),
            autoDisplay: false,
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
        setScriptLoaded(true);
        initializedRef.current = true;
      } catch (e) {
        console.error('Failed to initialize Google Translate:', e);
      }
    };

    // close menu on outside click
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    
    return () => {
      document.removeEventListener("click", onDoc);
    };
  }, []);

  const changeLang = (lang: string) => {
    // Clear any existing googtrans cookie first to avoid conflicts
    clearGoogtransCookie();
    
    // Set the new language
    try {
      if (lang === 'en') {
        // For English, we can either clear the cookie or set it to /auto/en
        // Clearing is simpler and forces a clean state
        setCurrent(lang);
        window.location.reload();
      } else {
        // For other languages, set the googtrans cookie
        const cookieVal = `/auto/${lang}`;
        setCookie("googtrans", cookieVal);
        setCurrent(lang);
        window.location.reload();
      }
    } catch (e) {
      console.warn('Failed to change language:', e);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  return (
  <div ref={containerRef} className="relative w-full text-left">
      {/* hidden original widget to keep compatibility */}
      <div id="google_translate_element" style={{ display: "none" }} />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-sm hover:shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={open}
        disabled={!scriptLoaded}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2v20" />
          </svg>
          <span className="uppercase">{current}</span>
          {!scriptLoaded && (
            <span className="text-xs opacity-75">(loading...)</span>
          )}
        </div>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {open && scriptLoaded && (
        <div className="absolute left-0 bottom-full mb-2 w-full rounded-md bg-white/98 dark:bg-slate-900/95 shadow-lg ring-1 ring-black/5 z-50">
          <div className="py-1 max-h-48 overflow-auto">
            {Object.entries(LANGS).map(([code, label]) => (
              <button
                key={code}
                onClick={() => changeLang(code)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${code === current ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'} `}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50/40 text-indigo-700 text-[11px] font-medium">{code.toUpperCase()}</span>
                <span className="flex-1">{label}</span>
                {code === current && <span className="text-yellow-500">●</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
