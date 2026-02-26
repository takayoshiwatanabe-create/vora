import { Stack, useRouter, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isRTL } from "@/i18n"; // Import isRTL
import { I18nManager } from "react-native";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useFonts } from "expo-font";
import * as Updates from 'expo-updates'; // Import Updates

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession); // Get setSession from Zustand
  const [fontsLoaded] = useFonts({
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
  });

  // Custom hook to manage auth session
  useAuth(setSession); // Pass setSession to the hook

  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        // Set RTL direction for the entire app
        // The i18n/index.ts module already sets I18nManager.forceRTL and I18nManager.allowRTL
        // based on the detected locale's text direction.
        // If the app is already configured for RTL and the current locale is RTL,
        // or if it's LTR and the current locale is LTR, no change is needed.
        // If there's a mismatch, it means the app needs to reload to apply the new direction.
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
          I18nManager.allowRTL(isRTL);
          // On native, a full reload is often required for the full effect.
          if (Updates.isEmbedded) {
            await Updates.reloadAsync();
          } else {
            // In development, `Updates.reloadAsync` might not work as expected.
            // Advise user to restart manually.
            console.warn("Updates.reloadAsync is not available in development. Please restart your app manually for RTL changes to take effect.");
          }
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        void SplashScreen.hideAsync(); // Use void to ignore the Promise
      }
    }

    if (fontsLoaded) {
      void prepare(); // Use void to ignore the Promise
    }
  }, [fontsLoaded, isRTL]); // Add isRTL to dependencies, lang is implicitly handled by isRTL

  useEffect(() => {
    if (isReady) {
      if (session) {
        router.replace("/(main)"); // User is authenticated, go to main app
      } else {
        router.replace("/(auth)/sign-in"); // No session, go to sign-in
      }
    }
  }, [session, isReady, router]);

  if (!isReady || !fontsLoaded) {
    return null; // Keep splash screen visible
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        {/* The root index.tsx is typically for a splash screen or initial redirect logic,
            but if it's meant to be a standalone screen, it should be handled.
            Given the current logic, it's likely meant to redirect. */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Add a catch-all for unhandled routes or a 404 page */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaProvider>
  );
}

