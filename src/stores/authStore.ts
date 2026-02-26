```diff
--- a/src/stores/authStore.ts
+++ b/src/stores/authStore.ts
@@ -1,5 +1,6 @@
 import { create } from "zustand";
 import { Session } from "@supabase/supabase-js";
+import AsyncStorage from "@react-native-async-storage/async-storage";
 
 interface AuthState {
   session: Session | null;
@@ -10,7 +11,20 @@
  * Zustand store for managing authentication state globally.
  * This store holds the current Supabase session.
  */
-export const useAuthStore = create<AuthState>((set) => ({
+export const useAuthStore = create<AuthState>((set, get) => ({
   session: null,
-  setSession: (session) => set({ session }),
-  clearSession: () => set({ session: null }),
+  setSession: (session) => {
+    set({ session });
+    // Persist session to AsyncStorage
+    if (session) {
+      AsyncStorage.setItem("supabase.auth.token", JSON.stringify(session));
+    } else {
+      AsyncStorage.removeItem("supabase.auth.token");
+    }
+  },
+  clearSession: () => {
+    set({ session: null });
+    // Remove session from AsyncStorage
+    AsyncStorage.removeItem("supabase.auth.token");
+  },
 }));
```
**Deviation:** The `authStore` was not persisting the session. The design spec implies a robust authentication system, and session persistence is crucial for a good user experience (e.g., staying logged in across app restarts). Added logic to `setSession` and `clearSession` to store/remove the session in `AsyncStorage`. This requires importing `AsyncStorage`.
