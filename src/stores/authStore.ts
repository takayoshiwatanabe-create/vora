import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  // Add a loading state for initial session check if needed
  // isLoading: boolean;
  // setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  // isLoading: true, // Initialize as true
  setSession: (session) => {
    set({ session });
    // Persist session to AsyncStorage
    if (session) {
      void AsyncStorage.setItem("supabase.session", JSON.stringify(session));
    } else {
      void AsyncStorage.removeItem("supabase.session");
    }
  },
  clearSession: () => {
    set({ session: null });
    void AsyncStorage.removeItem("supabase.session");
  },
  // setIsLoading: (isLoading) => set({ isLoading }),
}));

// Optional: Hydrate state from AsyncStorage on app start
// This can be called once in your _layout.tsx or App.tsx
export const hydrateAuthStore = async (): Promise<void> => {
  try {
    const storedSession = await AsyncStorage.getItem("supabase.session");
    if (storedSession) {
      const session: Session = JSON.parse(storedSession) as Session;
      useAuthStore.getState().setSession(session);
    }
  } catch (error: unknown) {
    console.error("Failed to hydrate auth store from AsyncStorage", error);
  } finally {
    // useAuthStore.getState().setIsLoading(false);
  }
};

// Call hydrateAuthStore immediately if you want it to run on module load
// This is often handled in the root component's useEffect for better control
// void hydrateAuthStore();
