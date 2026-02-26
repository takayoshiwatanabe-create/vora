```diff
--- a/app/(main)/kanban/index.tsx
+++ b/app/(main)/kanban/index.tsx
@@ -1,6 +1,6 @@
 import React from "react";
 import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from "react-native";
-import { useKanbanBoards } from "@/hooks/useKanbanBoards";
+import { useKanbanBoards } from "@/src/hooks/useKanbanBoards"; // Corrected import path
 import { KanbanBoardListItem } from "@/components/kanban-board-list-item";
 import { t, isRTL } from "@/i18n";
 import { Stack } from "expo-router";
```
**Deviation:** The import path for `useKanbanBoards` was `hooks/useKanbanBoards`. According to the project structure and best practices, hooks should reside in `src/hooks`. The path has been corrected to `src/hooks/useKanbanBoards`.
