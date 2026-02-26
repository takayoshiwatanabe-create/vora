import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { t, isRTL, lang } from "@/i18n"; // Import lang for locale-specific OAuth redirects
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore"; // Import Zustand store

export default function SignInScreen(): JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession); // Get setSession from Zustand

  const handleSignIn = async (): Promise<void> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(t("auth.signInErrorTitle"), error.message);
    } else if (data.session) {
      setSession(data.session); // Update Zustand store
      router.replace("/"); // Redirect to home after successful sign-in
    }
    setLoading(false);
  };

  const handleMagicLink = async (): Promise<void> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      Alert.alert(t("auth.magicLinkErrorTitle"), error.message);
    } else {
      Alert.alert(
        t("auth.magicLinkSuccessTitle"),
        t("auth.magicLinkSuccessMessage")
      );
    }
    setLoading(false);
  };

  // OAuth sign-in (e.g., Google, Apple) would be implemented here
  // For Expo, this typically involves `expo-auth-session` and a custom provider setup.
  // This example focuses on email/password and magic link as per common Supabase patterns.
  const handleOAuthSignIn = async (provider: "google" | "apple"): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "vora://auth/callback", // Deep link for OAuth callback
          queryParams: {
            lang: lang, // Pass current language to OAuth flow if needed
          },
        },
      });
      if (error) {
        Alert.alert(t("auth.oauthErrorTitle"), error.message);
      }
    } catch (error: unknown) {
      Alert.alert(t("auth.oauthErrorTitle"), (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>
        {t("auth.signInTitle")}
      </Text>

      <TextInput
        style={[styles.input, isRTL && styles.rtlInput]}
        placeholder={t("auth.emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      <TextInput
        style={[styles.input, isRTL && styles.rtlInput]}
        placeholder={t("auth.passwordPlaceholder")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("auth.signInButton")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.magicLinkButton]}
        onPress={handleMagicLink}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#007bff" />
        ) : (
          <Text style={styles.magicLinkButtonText}>
            {t("auth.magicLinkButton")}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.oauthContainer}>
        <TouchableOpacity
          style={[styles.oauthButton, styles.googleButton]}
          onPress={() => void handleOAuthSignIn("google")}
          disabled={loading}
        >
          <Text style={styles.oauthButtonText}>
            {t("auth.signInWithGoogle")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.oauthButton, styles.appleButton]}
          onPress={() => void handleOAuthSignIn("apple")}
          disabled={loading}
        >
          <Text style={styles.oauthButtonText}>{t("auth.signInWithApple")}</Text>
        </TouchableOpacity>
      </View>

      <Link href="/(auth)/sign-up" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>{t("auth.noAccountSignUp")}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  rtlText: {
    textAlign: "right",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  rtlInput: {
    textAlign: "right",
  },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#007bff",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  magicLinkButton: {
    backgroundColor: "#e0e0e0",
  },
  magicLinkButtonText: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "bold",
  },
  oauthContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
    marginBottom: 20,
  },
  oauthButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  googleButton: {
    backgroundColor: "#db4437", // Google red
  },
  appleButton: {
    backgroundColor: "#000", // Apple black
  },
  oauthButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: "#007bff",
    fontSize: 16,
  },
});

