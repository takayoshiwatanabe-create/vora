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
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(t("auth.signInErrorTitle"), error.message);
    } else {
      router.replace("/"); // Navigate to home on successful sign-in
    }
    setLoading(false);
  };

  const handleMagicLinkSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "vora://auth/callback", // Deep link for magic link
      },
    });

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
  const handleOAuthSignIn = (provider: "google" | "apple") => {
    Alert.alert(
      t("auth.oauthNotImplementedTitle"),
      t("auth.oauthNotImplementedMessage", { provider: provider })
    );
    // In a real app, you'd use `supabase.auth.signInWithOAuth` here
    // with appropriate redirect URLs and `expo-auth-session`.
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
        onPress={handleMagicLinkSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("auth.magicLinkButton")}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.separator}>
        <Text style={styles.separatorText}>{t("auth.or")}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.oauthButton]}
        onPress={() => handleOAuthSignIn("google")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{t("auth.signInWithGoogle")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.oauthButton]}
        onPress={() => handleOAuthSignIn("apple")}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{t("auth.signInWithApple")}</Text>
      </TouchableOpacity>

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
  magicLinkButton: {
    backgroundColor: "#28a745",
  },
  oauthButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 20,
    width: "100%",
    alignItems: "center",
  },
  separatorText: {
    color: "#666",
    fontSize: 16,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: "#007bff",
    fontSize: 16,
  },
});
