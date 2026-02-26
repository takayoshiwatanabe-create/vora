import { StyleSheet, Text, View, Button } from "react-native";
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useRouter, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { VoiceInputButton } from "@/components/voice-input-button"; // Import VoiceInputButton

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleSignOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
    clearSession(); // Clear session from Zustand store
    router.replace("/(auth)/sign-in"); // Redirect to sign-in page
  };

  const handleCardCreated = (cardText: string): void => {
    console.log("Card created with text:", cardText);
    // Optionally navigate to the board or show a toast
  };

  return (
    <View style={[styles.container, isRTL ? styles.rtlContainer : null]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={[styles.title, isRTL ? styles.rtlText : null]}>{t("home.title")}</Text>
      <Text style={[styles.subtitle, isRTL ? styles.rtlText : null]}>{t("home.subtitle")}</Text>
      <VoiceInputButton onCardCreated={handleCardCreated} /> {/* Integrate VoiceInputButton */}
      <Button title={t("home.signOutButton")} onPress={handleSignOut} />
      <Button title={t("home.goToKanbanBoards")} onPress={() => router.push("/(main)/kanban")} />
      <Button title={t("settings.title")} onPress={() => router.push("/(main)/settings")} /> {/* Added missing button */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  rtlText: {
    textAlign: "right",
  },
});

