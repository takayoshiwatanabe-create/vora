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
import { useAuthStore } from "@/stores/authStore"; // Import Zustand store

export default function SignUpScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession); // Get setSession from Zustand

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert(t("auth.signUpErrorTitle"), error.message);
    } else if (data.session) {
      setSession(data.session); // Update Zustand store
      Alert.alert(
        t("auth.signUpSuccessTitle"),
        t("auth.signUpSuccessMessage")
      );
      router.replace("/"); // Redirect to home after successful sign-up and session set
    } else if (data.user && !data.session) {
      // User created but no session (e.g., email confirmation required)
      Alert.alert(
        t("auth.signUpSuccessTitle"),
        t("auth.signUpConfirmationMessage") // New translation key for confirmation
      );
      router.replace("/(auth)/sign-in"); // Redirect to sign-in to await confirmation
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>
        {t("auth.signUpTitle")}
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
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("auth.signUpButton")}</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/sign-in" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>{t("auth.alreadyHaveAccountSignIn")}</Text>
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
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: "#007bff",
    fontSize: 16,
  },
});

