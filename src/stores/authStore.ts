import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    {
      name: "auth-storage", // unique name
      storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for persistence
      partialize: (state) => ({ session: state.session }), // Only persist the session
    }
  )
);
