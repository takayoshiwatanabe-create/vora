import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import { I18n } from "i18n-js";
import { translations } from "./translations";

// Determine the primary language code and text direction
const primaryLocale = Localization.getLocales()[0];
export const lang = primaryLocale?.languageCode || "ja"; // Default to Japanese
export const isRTL = primaryLocale?.textDirection === "rtl";

// Set I18nManager.forceRTL and I18nManager.allowRTL immediately on module load
// This ensures it's set before any components render, which is crucial for native.
// The actual reload logic should be handled in _layout.tsx for better control.
if (I18nManager.isRTL !== isRTL) {
  I18nManager.forceRTL(isRTL);
  I18nManager.allowRTL(isRTL);
  // Do NOT force reload here. Let _layout.tsx handle it if necessary.
}

const i18n = new I18n(translations);

// Set the locale for i18n-js
i18n.locale = lang;

// When a key is missing in a translation file, use the Japanese translation.
i18n.enableFallback = true;
i18n.defaultLocale = "ja";

/**
 * Translates a given key into the current locale.
 * @param key The translation key (e.g., "home.title").
 * @param options Optional parameters for interpolation or pluralization.
 * @returns The translated string.
 */
export const t = (key: string, options?: Record<string, unknown>): string => {
  return i18n.t(key, options);
};
