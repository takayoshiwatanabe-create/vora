import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";
import { I18nManager } from "react-native"; // Re-added I18nManager import

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
if (I18nManager.isRTL !== isRTL) {
  I18nManager.forceRTL(isRTL);
  I18nManager.allowRTL(isRTL);
  // Forcing a reload is often necessary for full RTL changes to take effect on native.
  // This should ideally be handled at the app's entry point or a splash screen
  // to prevent UI glitches. For now, we set it here.
  // In a real app, you might want to prompt the user to restart or handle this more gracefully.
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
