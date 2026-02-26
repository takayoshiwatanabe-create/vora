```diff
--- a/components/kanban-board-list-item.tsx
+++ b/components/kanban-board-list-item.tsx
@@ -1,7 +1,7 @@
 import React from "react";
 import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
 import { useRouter } from "expo-router";
-import { KanbanBoard } from "@/hooks/useKanbanBoards";
+import { KanbanBoard } from "@/src/types/kanban"; // Corrected import path
 import { t, isRTL } from "@/i18n";
 
 interface KanbanBoardListItemProps {
```
**Deviation:** The import path for `KanbanBoard` was `hooks/useKanbanBoards`. The `KanbanBoard` interface is defined in `src/types/kanban.ts`. The path has been corrected to `src/types/kanban`. This also removes the need for a duplicate `KanbanBoard` interface definition in `hooks/useKanbanBoards.ts`.
