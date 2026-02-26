import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

// Access environment variables from Constants.expoConfig.extra
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

// Ensure environment variables are defined
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Provide a more descriptive error for development setup
  console.error(
    "Supabase URL and Anon Key must be defined in your app.json (extra field) or environment variables."
  );
  console.error(
    "Please add 'supabaseUrl' and 'supabaseAnonKey' to the 'extra' field in app.json."
  );
  // Fallback to dummy values to prevent app crash during development if not set,
  // but ensure a clear error message is displayed.
  // In a production environment, this would be a hard crash or pre-build check.
  // For now, we'll throw an error to ensure the developer addresses it.
  throw new Error(
    "Supabase URL and Anon Key are not configured. Please check app.json and environment variables."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for both web and native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

