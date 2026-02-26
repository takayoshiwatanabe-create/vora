import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

/**
 * Custom hook to manage Supabase authentication session.
 * It listens for auth state changes and updates the Zustand store.
 * @param setSessionStore A function to update the session in the Zustand store.
 */
export function useAuth(setSessionStore: (session: Session | null) => void): void {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSessionStore(session);
      }
    );

    // Fetch initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionStore(session);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [setSessionStore]);
}
