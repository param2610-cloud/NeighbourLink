declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

import { useEffect, useState } from "react";

const GoogleTranslate = () => {
  const [, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById("google-translate-script")) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,pa,bn",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
      setScriptLoaded(true);
    };
  }, []);

  return (
    <div>
      <div id="google_translate_element"></div>
    </div>
  );
};

export default GoogleTranslate;
