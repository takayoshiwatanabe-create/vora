```diff
--- a/i18n/index.ts
+++ b/i18n/index.ts
@@ -22,7 +22,7 @@
 // Set I18nManager.forceRTL and I18nManager.allowRTL immediately on module load
 // This ensures it's set before any components render, which is crucial for native.
 // The actual reload logic should be handled in _layout.tsx for better control.
-if (I18nManager.isRTL !== isRTL) {
+if (I18nManager.isRTL !== isRTL && lang === "ar") { // Only force RTL if language is Arabic
   I18nManager.forceRTL(isRTL);
   I18nManager.allowRTL(isRTL);
   // Do NOT force reload here. Let _layout.tsx handle it if necessary.
```
**Deviation:** Similar to `app/_layout.tsx`, the `I18nManager.forceRTL(isRTL)` logic was applied unconditionally if `I18nManager.isRTL !== isRTL`. The design spec states "RTL対応: アラビア語選択時、`dir="rtl"` をHTML要素に自動適用 (Web) / `I18nManager.forceRTL(true)` (Native)". This implies RTL should only be forced when the language is Arabic. The condition has been updated to `if (I18nManager.isRTL !== isRTL && lang === "ar")` to specifically apply RTL only for Arabic.
