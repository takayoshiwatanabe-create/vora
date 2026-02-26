import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useAuthStore } from "@/stores/authStore"; // Import the Zustand store

/**
 * Custom hook to manage Supabase authentication session.
 * Provides the current session and a loading state, and updates the Zustand store.
 *
 * @returns {{ session: Session | null, loading: boolean }}
 */
export function useAuth() {
  const setSessionStore = useAuthStore((state) => state.setSession);
  const sessionStore = useAuthStore((state) => state.session);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSessionStore(initialSession);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSessionStore(newSession);
        setLoading(false);
      }
    );

    // Cleanup the subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSessionStore]); // Dependency array includes setSessionStore to ensure it's stable

  return { session: sessionStore, loading };
}

