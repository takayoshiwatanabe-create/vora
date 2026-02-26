import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";

// Helper function to get environment variables securely
const getEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`);
  }
  return value;
};

// Supabase URL and Anon Key from environment variables
const supabaseUrl = getEnv("EXPO_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");

// SecureStore for storing refresh tokens (more secure than AsyncStorage for sensitive data)
// This is a common pattern for Expo apps with Supabase.
// For web, Supabase client handles storage automatically.
// For native, we need to provide a custom storage solution.
class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    if (Application.get and Application.get().applicationName) {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  }
  async setItem(key: string, value: string): Promise<void> {
    if (Application.get and Application.get().applicationName) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    if (Application.get and Application.get().applicationName) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(), // Use custom storage for refresh tokens
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});
