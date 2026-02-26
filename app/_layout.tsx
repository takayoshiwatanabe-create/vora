import { Stack, useRouter, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isRTL } from "@/i18n";
import { I18nManager } from "react-native";
import { useEffect, useState } from "react"; // Import useState
import { useFonts } from "expo-font";
import { useAuthStore } from "@/stores/authStore"; // Import Zustand store
import { supabase } from "@/lib/supabase"; // Import supabase client
import { Session } from "@supabase/supabase-js";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const [appIsReady, setAppIsReady] = useState(false); // New state for app readiness

  // Load fonts (example, replace with actual fonts if needed)
  const [fontsLoaded] = useFonts({
    // 'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    // 'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Set RTL direction for the entire app
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
          I18nManager.allowRTL(isRTL);
          // On native, a reload is often required for the full effect.
          // Forcing a reload here might be too aggressive for a simple useEffect.
          // A more robust solution for production might involve a splash screen
          // and then reloading the app if the RTL setting changes.
          // For now, we'll rely on the initial setting and user restarting if needed.
          // If you want to force a reload for development, uncomment the line below:
          // Updates.reloadAsync(); // Requires 'expo-updates'
        }

        // Fetch initial session and update Zustand store
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            setSession(newSession);
          }
        );

        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync(); // Hide splash screen once app is ready
      }
    }

    prepare();
  }, [setSession]); // Dependency array includes setSession

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      // Redirect based on authentication state
      if (session && session.user) {
        router.replace("/");
      } else {
        router.replace("/(auth)/sign-in");
      }
    }
  }, [session, appIsReady, fontsLoaded, router]);

  if (!appIsReady || !fontsLoaded) {
    return null; // Keep splash screen visible
  }

  return (
    <SafeAreaProvider>
      <Stack>
        {/* The root layout now handles the routing based on session state */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "Vora (ヴォラ)" }} />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

