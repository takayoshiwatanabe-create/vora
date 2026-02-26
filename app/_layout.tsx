import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { lang, isRTL } from "@/i18n";
import { I18nManager } from "react-native";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
  }, [isRTL]);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Vora (ヴォラ)" }} />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

