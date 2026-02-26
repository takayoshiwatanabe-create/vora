import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore"; // Import useAuthStore

/**
 * Custom hook to manage Supabase authentication session.
 * It listens for auth state changes and updates the Zustand store.
 */
export function useAuth(): void {
  const setSessionStore = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSessionStore(session);
      }
    );

    // Fetch initial session on mount
    // The `getSession` call is already handled by `onAuthStateChange` firing on initial load
    // if a session exists. Calling it explicitly here might cause a slight race condition
    // or redundant update. It's generally better to rely on `onAuthStateChange` for consistency.
    // However, for robustness, especially if `onAuthStateChange` doesn't fire immediately
    // on app start with an existing session, keeping it can be beneficial.
    // For now, let's keep it as it doesn't strictly violate the spec and provides a fallback.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionStore(session);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [setSessionStore]);
}
