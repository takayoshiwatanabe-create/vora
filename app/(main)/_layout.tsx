```diff
--- a/app/(main)/_layout.tsx
+++ b/app/(main)/_layout.tsx
@@ -5,7 +5,7 @@
     <Stack>
       <Stack.Screen
         name="index"
-        options={{ title: t("home.title"), headerShown: false }} // Hide header for the main home screen
+        options={{ title: t("home.title"), headerShown: false }}
       />
       <Stack.Screen
         name="kanban/index"
```
**Deviation:** Removed a redundant comment `// Hide header for the main home screen` as the `headerShown: false` option is self-explanatory.
