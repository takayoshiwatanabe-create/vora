import { Stack, useRouter, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isRTL, lang } from "@/i18n"; // Import lang
import { I18nManager } from "react-native";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/src/hooks/useAuth";
import { useFonts } from "expo-font";

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
        if (I18nManager.isRTL !== isRTL && lang === "ar") { // Only force RTL if language is Arabic
          I18nManager.forceRTL(isRTL);
          I18nManager.allowRTL(isRTL);
          // On native, a reload is often required for the full effect.
          // Forcing a reload here might be too aggressive for a simple useEffect.
          // A more robust solution for production might involve a splash screen
          // and then reloading the app if the RTL setting changes.
          // For now, we'll rely on the initial setting and user restarting if needed.
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
  }, [fontsLoaded, isRTL, lang]); // Add isRTL and lang to dependencies

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

