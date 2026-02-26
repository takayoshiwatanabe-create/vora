import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, I18nManager } from "react-native";
import { t, lang as currentLang, isRTL as currentIsRTL } from "@/i18n";
import { useRouter } from "expo-router";
import * as Localization from "expo-localization"; // Import Localization for setting locale
import * as Updates from 'expo-updates'; // Import Updates for reliable reload

interface LanguageSwitcherProps {
  // No props needed for now, but can be extended if specific behavior is required
}

export function LanguageSwitcher(_props: LanguageSwitcherProps): JSX.Element {
  const router = useRouter();

  const supportedLanguages = [
    { code: "ja", name: "日本語", isRTL: false },
    { code: "en", name: "English", isRTL: false },
    { code: "zh", name: "中文", isRTL: false },
    { code: "ko", name: "한국어", isRTL: false },
    { code: "es", name: "Español", isRTL: false },
    { code: "fr", name: "Français", isRTL: false },
    { code: "de", name: "Deutsch", isRTL: false },
    { code: "pt", name: "Português", isRTL: false },
    { code: "ar", name: "العربية", isRTL: true },
    { code: "hi", name: "हिन्दी", isRTL: false },
  ];

  const changeLanguage = async (newLang: string, newIsRTL: boolean): Promise<void> => {
    if (currentLang === newLang) {
      return; // No change needed
    }

    // Update i18n-js locale
    Localization.setLocale(newLang); // This updates the internal locale for i18n-js
    // The `lang` and `isRTL` exports from "@/i18n" will reflect this change on next render/reload.

    // Handle RTL change
    if (currentIsRTL !== newIsRTL) {
      I18nManager.forceRTL(newIsRTL);
      I18nManager.allowRTL(newIsRTL);
      // Forcing a reload is often necessary for I18nManager changes to take full effect
      // on native platforms. Use Updates.reloadAsync() for reliability.
      Alert.alert(
        t("common.languageChangeTitle"),
        t("common.languageChangeMessage"),
        [
          {
            text: t("common.restartApp"),
            onPress: () => {
              void Updates.reloadAsync(); // Use expo-updates for reliable reload
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      // If only language changes without RTL, a simple re-render might be enough.
      // Navigating to root will trigger re-evaluation of _layout.tsx and its children.
      router.replace("/");
    }
  };

  return (
    <View style={[styles.container, currentIsRTL && styles.rtlContainer]}>
      <Text style={[styles.title, currentIsRTL && styles.rtlText]}>
        {t("common.selectLanguage")}
      </Text>
      <View style={styles.languageList}>
        {supportedLanguages.map((langItem) => (
          <TouchableOpacity
            key={langItem.code}
            style={[
              styles.languageButton,
              currentLang === langItem.code && styles.activeLanguageButton,
            ]}
            onPress={() => void changeLanguage(langItem.code, langItem.isRTL)}
          >
            <Text
              style={[
                styles.languageButtonText,
                currentLang === langItem.code && styles.activeLanguageButtonText,
              ]}
            >
              {langItem.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  rtlText: {
    textAlign: "right",
  },
  languageList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  activeLanguageButton: {
    backgroundColor: "#007bff",
  },
  languageButtonText: {
    color: "#333",
    fontSize: 14,
  },
  activeLanguageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

