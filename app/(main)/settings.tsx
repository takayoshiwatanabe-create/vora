import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { t, isRTL, lang } from "@/i18n";
import { UserProfile } from "@/components/user-profile";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { I18nManager } from "react-native";
import * as Updates from 'expo-updates'; // Import Updates
import * as Linking from 'expo-linking'; // Import Linking for privacy policy URL

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.session?.user);

  // Example state for settings (these would typically be stored in DB or local storage)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(false); // Not yet implemented, but for future

  const availableLanguages = [
    { code: "ja", name: "日本語" },
    { code: "en", name: "English" },
    { code: "zh", name: "中文 (简体)" },
    { code: "ko", name: "한국어" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "pt", name: "Português (Brasil)" },
    { code: "ar", name: "العربية" },
    { code: "hi", name: "हिन्दी" },
  ];

  const handleLanguageChange = (newLang: string): void => {
    if (lang === newLang) return; // No change needed

    Alert.alert(
      t("settings.languageChangeTitle"),
      t("settings.languageChangeMessage", { langName: availableLanguages.find(l => l.code === newLang)?.name || newLang }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.ok"),
          onPress: async () => { // Make onPress async
            // This is a simplified approach. In a real app, you'd update a global state
            // or persist this setting, then trigger a full app reload to apply i18n changes.
            // For Expo, `Localization.setLocale` is not available directly for runtime changes.
            // The `i18n/index.ts` module reads `Localization.getLocales()[0]?.languageCode` on load.
            // To truly change the language at runtime, you'd need to:
            // 1. Persist the user's chosen language (e.g., AsyncStorage, Supabase profile).
            // 2. Modify `i18n/index.ts` to read this persisted value first, then fallback to `expo-localization`.
            // 3. Force a full app reload (e.g., `Updates.reloadAsync()` in production, or simply restarting dev server).
            // For this example, we'll just show the alert and log the change.
            console.log(`Language changed to: ${newLang}`);
            // Forcing RTL for Arabic
            const newIsRTL = newLang === "ar";
            if (I18nManager.isRTL !== newIsRTL) {
              I18nManager.forceRTL(newIsRTL);
              I18nManager.allowRTL(newIsRTL);
              // On web, a simple refresh might suffice. On native, a full reload is often necessary.
              if (Platform.OS !== 'web') {
                Alert.alert(
                  t("settings.restartRequiredTitle"),
                  t("settings.restartRequiredMessage"),
                  [{ text: t("common.ok"), onPress: async () => {
                    if (Updates.isEmbedded) {
                      await Updates.reloadAsync();
                    } else {
                      // In development, `Updates.reloadAsync` might not work as expected.
                      // Advise user to restart manually.
                      console.warn("Updates.reloadAsync is not available in development. Please restart your app manually.");
                    }
                  } }]
                );
              } else {
                window.location.reload();
              }
            } else if (Platform.OS === 'web') {
              window.location.reload(); // For web, a reload is generally needed to pick up new locale
            } else {
              Alert.alert(
                t("settings.restartRequiredTitle"),
                t("settings.restartRequiredMessage"),
                [{ text: t("common.ok"), onPress: async () => {
                  if (Updates.isEmbedded) {
                    await Updates.reloadAsync();
                  } else {
                    console.warn("Updates.reloadAsync is not available in development. Please restart your app manually.");
                  }
                } }]
              );
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      Alert.alert(t("common.error"), error.message);
    }
    clearSession();
    router.replace("/(auth)/sign-in");
  };

  const handlePrivacyPolicyPress = (): void => {
    // This URL should be configured in app.json or a constants file
    const privacyPolicyUrl = "https://www.vora.com/privacy"; // Example URL
    void Linking.openURL(privacyPolicyUrl);
  };

  const handleBillingPress = (): void => {
    Alert.alert(
      t("settings.billingInfoTitle"),
      t("settings.billingInfoMessage"),
      [
        {
          text: t("common.ok"),
          onPress: () => {
            // For digital content sales, use StoreKit/IAP (In-App Purchases)
            // Do NOT link directly to external payment websites.
            // Example: Implement a native module or use a library like `expo-in-app-purchases`
            // to handle subscriptions or one-time purchases.
            console.log("Navigate to in-app purchase flow or subscription management.");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, isRTL ? styles.rtlContainer : null]}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen options={{ title: t("settings.title") }} />

      <Text style={[styles.sectionTitle, isRTL ? styles.rtlText : null]}>
        {t("settings.accountSection")}
      </Text>
      {user ? (
        <UserProfile user={user} />
      ) : (
        <Text style={[styles.infoText, isRTL ? styles.rtlText : null]}>
          {t("auth.notAuthenticated")}
        </Text>
      )}

      <Text style={[styles.sectionTitle, isRTL ? styles.rtlText : null]}>
        {t("settings.generalSection")}
      </Text>

      <View style={[styles.settingItem, isRTL ? styles.rtlSettingItem : null]}>
        <Text style={[styles.settingLabel, isRTL ? styles.rtlText : null]}>
          {t("settings.languageSetting")}
        </Text>
        <View style={styles.languageOptions}>
          {availableLanguages.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[
                styles.languageButton,
                lang === l.code && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange(l.code)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  lang === l.code && styles.languageButtonTextActive,
                ]}
              >
                {l.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.settingItem, isRTL ? styles.rtlSettingItem : null]}>
        <Text style={[styles.settingLabel, isRTL ? styles.rtlText : null]}>
          {t("settings.notificationsSetting")}
        </Text>
        <Switch
          onValueChange={setNotificationsEnabled}
          value={notificationsEnabled}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={notificationsEnabled ? "#007bff" : "#f4f3f4"}
        />
      </View>

      <View style={[styles.settingItem, isRTL ? styles.rtlSettingItem : null]}>
        <Text style={[styles.settingLabel, isRTL ? styles.rtlText : null]}>
          {t("settings.darkModeSetting")}
        </Text>
        <Switch
          onValueChange={setDarkModeEnabled}
          value={darkModeEnabled}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={darkModeEnabled ? "#007bff" : "#f4f3f4"}
        />
      </View>

      <Text style={[styles.sectionTitle, isRTL ? styles.rtlText : null]}>
        {t("settings.privacySection")}
      </Text>
      <TouchableOpacity
        style={[styles.settingItem, isRTL ? styles.rtlSettingItem : null]}
        onPress={handlePrivacyPolicyPress}
      >
        <Text style={[styles.settingLabel, isRTL ? styles.rtlText : null]}>
          {t("settings.privacyPolicy")}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.privacyText, isRTL ? styles.rtlText : null]}>
        {t("settings.voiceDataPolicy")}
      </Text>

      <Text style={[styles.sectionTitle, isRTL ? styles.rtlText : null]}>
        {t("settings.billingSection")}
      </Text>
      <TouchableOpacity
        style={[styles.settingItem, isRTL ? styles.rtlSettingItem : null]}
        onPress={handleBillingPress}
      >
        <Text style={[styles.settingLabel, isRTL ? styles.rtlText : null]}>
          {t("settings.billingInfo")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>
          {t("settings.signOutButton")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 25,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  rtlSettingItem: {
    flexDirection: "row-reverse", // Reverse for RTL
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1, // Allow text to take available space
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end", // Align to right for LTR, left for RTL
    flex: 2, // Take more space for language buttons
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    marginLeft: 5,
    marginBottom: 5,
  },
  languageButtonActive: {
    backgroundColor: "#007bff",
  },
  languageButtonText: {
    color: "#333",
    fontSize: 14,
  },
  languageButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  privacyText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingVertical: 10,
  },
  rtlText: {
    textAlign: "right",
  },
});
