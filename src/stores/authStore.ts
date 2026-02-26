import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  // Hydration state for AsyncStorage persistence
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  _hasHydrated: false, // Initial hydration state
  setHasHydrated: (state) => {
    set({
      _hasHydrated: state
    });
  },
  setSession: (session) => {
    set({ session, user: session?.user || null });
    // Persist session to AsyncStorage
    if (session) {
      void AsyncStorage.setItem("supabase.auth.session", JSON.stringify(session));
    } else {
      void AsyncStorage.removeItem("supabase.auth.session");
    }
  },
  clearSession: () => {
    set({ session: null, user: null });
    void AsyncStorage.removeItem("supabase.auth.session");
  },
}));

// Hydration logic for Zustand with AsyncStorage
// This should be called once at the app's entry point (e.g., _layout.tsx)
export async function hydrateAuthStore(): Promise<void> {
  try {
    const sessionString = await AsyncStorage.getItem("supabase.auth.session");
    if (sessionString) {
      const session: Session = JSON.parse(sessionString) as Session;
      useAuthStore.getState().setSession(session);
    }
  } catch (e) {
    console.error("Failed to hydrate auth store from AsyncStorage", e);
  } finally {
    useAuthStore.getState().setHasHydrated(true);
  }
}

