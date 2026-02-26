```diff
--- a/app/(auth)/sign-in.tsx
+++ b/app/(auth)/sign-in.tsx
@@ -10,7 +10,7 @@
   ActivityIndicator,
 } from "react-native";
 import { Link, useRouter } from "expo-router";
-import { t, isRTL } from "@/i18n";
+import { t, isRTL, lang } from "@/i18n"; // Import lang for locale-specific OAuth redirects
 import { supabase } from "@/lib/supabase";
 import { useAuthStore } from "@/stores/authStore"; // Import Zustand store
 
@@ -53,13 +53,24 @@
   // OAuth sign-in (e.g., Google, Apple) would be implemented here
   // For Expo, this typically involves `expo-auth-session` and a custom provider setup.
   // This example focuses on email/password and magic link as per common Supabase patterns.
-  const handleOAuthSignIn = (provider: "google" | "apple"): void => {
-    Alert.alert(
-      t("auth.oauthNotImplementedTitle"),
-      t("auth.oauthNotImplementedMessage", { provider: provider })
-    );
-    // In a real app, you'd use `supabase.auth.signInWithOAuth` here
-    // with appropriate redirect URLs and `expo-auth-session`.
+  const handleOAuthSignIn = async (provider: "google" | "apple"): Promise<void> => {
+    setLoading(true);
+    try {
+      const { error } = await supabase.auth.signInWithOAuth({
+        provider,
+        options: {
+          redirectTo: "vora://auth/callback", // Deep link for OAuth callback
+          queryParams: {
+            lang: lang, // Pass current language to OAuth flow if needed
+          },
+        },
+      });
+      if (error) {
+        Alert.alert(t("auth.oauthErrorTitle"), error.message);
+      }
+    } catch (error: unknown) {
+      Alert.alert(t("auth.oauthErrorTitle"), (error as Error).message);
+    } finally {
+      setLoading(false);
+    }
   };
 
   return (
```
**Deviation:** The `handleOAuthSignIn` function was a placeholder with an `Alert`. The design spec mentions Supabase Auth (OAuth2), so a basic implementation using `supabase.auth.signInWithOAuth` has been added. This includes:
- Setting `loading` state.
- Using `supabase.auth.signInWithOAuth` with a `redirectTo` deep link (common for Expo).
- Passing the current `lang` as a query parameter, which can be useful for localized OAuth flows.
- Error handling with `Alert.alert`.
- Importing `lang` from `@/i18n`.
- Adding `auth.oauthErrorTitle` to translations for proper i18n.
