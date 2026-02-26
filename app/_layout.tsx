```diff
--- a/app/_layout.tsx
+++ b/app/_layout.tsx
@@ -1,12 +1,12 @@
 import { Stack, useRouter, SplashScreen } from "expo-router";
 import { StatusBar } from "expo-status-bar";
 import { SafeAreaProvider } from "react-native-safe-area-context";
-import { isRTL } from "@/i18n";
+import { isRTL, lang } from "@/i18n"; // Import lang
 import { I18nManager } from "react-native";
 import { useEffect, useState } => {
   const [isReady, setIsReady] = useState(false);
   const router = useRouter();
   const session = useAuthStore((state) => state.session);
   const setSession = useAuthStore((state) => state.setSession); // Get setSession from Zustand
   const [fontsLoaded] = useFonts({
     "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
     "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
     "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
   });
 
   // Custom hook to manage auth session
   useAuth(setSession); // Pass setSession to the hook
 
   useEffect(() => {
     async function prepare(): Promise<() => void> {
       try {
         // Set RTL direction for the entire app
-        if (I18nManager.isRTL !== isRTL) {
+        if (I18nManager.isRTL !== isRTL && lang === "ar") { // Only force RTL if language is Arabic
           I18nManager.forceRTL(isRTL);
           I18nManager.allowRTL(isRTL);
           // On native, a reload is often required for the full effect.
           // Forcing a reload here might be too aggressive for a simple useEffect.
           // A more robust solution for production might involve a splash screen
           // and then reloading the app if the RTL setting changes.
           // For now, we'll rely on the initial setting and user restarting if needed.
```
**Deviation:** The `useAuth` hook was not being used correctly. It was designed to receive `setSessionStore` as a parameter. The `_layout.tsx` was not passing this, leading to the hook not being able to update the Zustand store. This has been corrected by passing `setSession` from `useAuthStore` to `useAuth`.

**Deviation:** The `I18nManager.forceRTL(isRTL)` logic was applied unconditionally if `I18nManager.isRTL !== isRTL`. However, `isRTL` is a boolean derived from the current language. The design spec states "RTL対応: アラビア語選択時、`dir="rtl"` をHTML要素に自動適用 (Web) / `I18nManager.forceRTL(true)` (Native)". This implies RTL should only be forced when the language is Arabic. The condition has been updated to `if (I18nManager.isRTL !== isRTL && lang === "ar")` to specifically apply RTL only for Arabic. This also required importing `lang`.
