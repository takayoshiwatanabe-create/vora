```diff
--- a/src/components/kanban-board-list-item.tsx
+++ b/src/components/kanban-board-list-item.tsx
@@ -1,7 +1,7 @@
 import React from "react";
 import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
 import { KanbanBoard } from "@/types/kanban";
-import { t, isRTL, lang } from "@/i18n"; // Import lang for locale
+import { t, isRTL, lang } from "@/i18n";
 import { Link } from "expo-router";
 
 interface KanbanBoardListItemProps {
@@ -9,11 +9,10 @@
 }
 
 export function KanbanBoardListItem({ board }: KanbanBoardListItemProps) {
-  // Use the `lang` variable from i18n/index.ts for toLocaleDateString
-  const createdAt = new Date(board.created_at).toLocaleDateString(lang, {
+  const formattedDate = new Date(board.created_at).toLocaleDateString(lang, {
     year: "numeric",
     month: "short",
     day: "numeric",
   });
-
   return (
     <Link href={`/(main)/kanban/${board.id}`} asChild>
       <TouchableOpacity style={[styles.container, isRTL && styles.rtlContainer]}>
@@ -24,7 +23,7 @@
             </Text>
           )}
           <Text style={[styles.date, isRTL && styles.rtlText]}>
-            {t("kanban.boardCreated", { date: createdAt })}
+            {t("kanban.boardCreated", { date: formattedDate })}
           </Text>
         </View>
       </TouchableOpacity>
```
**Deviation:** The comment `// Use the \`lang\` variable from i18n/index.ts for toLocaleDateString` was redundant as `lang` is already imported and used. The variable name `createdAt` was also a bit misleading as it was already a formatted string, not the raw date. Renamed to `formattedDate` for clarity.
