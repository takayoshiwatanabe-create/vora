```diff
--- a/src/hooks/useAuth.ts
+++ b/src/hooks/useAuth.ts
@@ -1,7 +1,6 @@
 import { useState, useEffect } from "react";
 import { supabase } from "@/lib/supabase";
 import { Session } from "@supabase/supabase-js";
-import { useAuthStore } from "@/stores/authStore"; // Import the Zustand store
 
 /**
  * Custom hook to manage Supabase authentication session.
@@ -9,8 +8,7 @@
  *
  * @returns {{ session: Session | null, loading: boolean }}
  */
-export function useAuth() {
-  const setSessionStore = useAuthStore((state) => state.setSession);
+export function useAuth(setSessionStore: (session: Session | null) => void) {
   const sessionStore = useAuthStore((state) => state.session);
   const [loading, setLoading] = useState<boolean>(true);
 
```
**Deviation:** The `useAuth` hook was directly importing `useAuthStore` and calling `setSession` internally. This creates a tight coupling and makes the hook less flexible for testing or for scenarios where the `setSession` function might come from a different context. By passing `setSessionStore` as a prop, the hook becomes more modular and testable. The `useAuthStore` import was removed from the hook itself.
