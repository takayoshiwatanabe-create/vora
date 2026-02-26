import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";
import { I18nManager } from "react-native";

const SUPPORTED_LANGUAGES: Language[] = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];

function getLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const deviceLang = locales[0]?.languageCode ?? "ja";
    if (SUPPORTED_LANGUAGES.includes(deviceLang as Language)) {
      return deviceLang as Language;
    }
    return "ja";
  } catch (error) {
    console.error("Error getting device language:", error);
    return "ja";
  }
}

export const lang = getLanguage();
export const isRTL = ["ar"].includes(lang);

// Force RTL layout if the language is RTL, this needs to be set before any UI renders
// This is done in _layout.tsx useEffect, but for consistency and immediate availability
// in some contexts, it's good to have it here too.
I18nManager.forceRTL(isRTL);
I18nManager.allowRTL(isRTL);


export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = translations[lang] ?? translations.ja;
  let text = dict[key] ?? translations.ja[key] ?? `[MISSING: ${key}]`; // Fallback to key itself for dev, as per spec
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
    }
  }
  return text;
}

