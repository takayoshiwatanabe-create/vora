import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isRTL } from "@/i18n";
import { I18nManager } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font"; // Import useFonts

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load fonts (example, replace with actual fonts if needed)
  const [fontsLoaded] = useFonts({
    // 'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    // 'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  });

  useEffect(() => {
    // Set RTL direction for the entire app
    // This needs to be set early in the app lifecycle.
    // Forcing a reload is often necessary for full RTL changes to take effect on native.
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run once on mount

  if (loading || !fontsLoaded) {
    // You might want to render a loading splash screen here
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack>
        {session && session.user ? (
          // Authenticated user
          <Stack.Screen name="index" options={{ title: "Vora (ヴォラ)" }} />
        ) : (
          // Unauthenticated user
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
