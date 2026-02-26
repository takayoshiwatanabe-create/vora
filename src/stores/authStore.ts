import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
}

/**
 * Zustand store for managing authentication state globally.
 * This store holds the current Supabase session.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => {
    set({ session });
    // Persist session to AsyncStorage
    if (session) {
      void AsyncStorage.setItem("supabase.auth.token", JSON.stringify(session));
    } else {
      void AsyncStorage.removeItem("supabase.auth.token");
    }
  },
  clearSession: () => {
    set({ session: null });
    // Remove session from AsyncStorage
    void AsyncStorage.removeItem("supabase.auth.token");
  },
}));
