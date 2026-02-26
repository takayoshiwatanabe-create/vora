```diff
--- a/app/(main)/index.tsx
+++ b/app/(main)/index.tsx
@@ -1,10 +1,9 @@
 import { StyleSheet, Text, View, Button } from "react-native";
 import { t, isRTL } from "@/i18n";
 import { supabase } from "@/lib/supabase";
-import { useRouter } from "expo-router";
+import { useRouter, Stack } from "expo-router";
 import { useAuthStore } from "@/stores/authStore";
-import { Stack } from "expo-router"; // Import Stack
-
+
 export default function HomeScreen(): JSX.Element {
   const router = useRouter();
   const clearSession = useAuthStore((state) => state.clearSession);
@@ -21,7 +20,7 @@
 
   return (
     <View style={[styles.container, isRTL && styles.rtlContainer]}>
-      <Stack.Screen options={{ headerShown: false }} /> {/* Hide header for this specific screen */}
+      <Stack.Screen options={{ headerShown: false }} />
       <Text style={[styles.title, isRTL && styles.rtlText]}>{t("home.title")}</Text>
       <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t("home.subtitle")}</Text>
       <Button title={t("home.signOutButton")} onPress={handleSignOut} />
```
**Deviation:** Removed a redundant comment `// Import Stack` as `Stack` is imported and used. Also removed a redundant comment `// Hide header for this specific screen` as the `headerShown: false` option is self-explanatory.
