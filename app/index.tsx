import { StyleSheet, Text, View, Button } from "react-native";
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function HomeScreen() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      // Optionally show an alert to the user
    } else {
      clearSession(); // Clear session from Zustand store
      router.replace("/(auth)/sign-in"); // Redirect to sign-in page
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t("home.title")}</Text>
      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t("home.subtitle")}</Text>
      <Button title={t("home.signOutButton")} onPress={handleSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  rtlContainer: {
    // For RTL, if specific layout adjustments are needed beyond text alignment
    // For example, if elements need to be reversed in order or positioned differently.
    // For now, text alignment is handled by rtlText.
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 16,
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  rtlText: {
    textAlign: "right",
  },
});

