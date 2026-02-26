import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";
import { I18nManager } from "react-native";

const SUPPORTED_LANGUAGES: Language[] = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];

function getLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    // Use `languageCode` for the primary language code (e.g., "en", "ja")
    // Fallback to `languageTag` if `languageCode` is not available or suitable
    const deviceLang = locales[0]?.languageCode || locales[0]?.languageTag?.split('-')[0] || "ja";
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

// Set I18nManager.forceRTL and I18nManager.allowRTL immediately on module load
// This ensures it's set before any components render, which is crucial for native.
// The actual reload logic should be handled in _layout.tsx for better control.
if (I18nManager.isRTL !== isRTL) {
  I18nManager.forceRTL(isRTL);
  I18nManager.allowRTL(isRTL);
  // Do NOT force reload here. Let _layout.tsx handle it if necessary.
}

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


