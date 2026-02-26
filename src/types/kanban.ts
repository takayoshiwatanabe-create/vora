```diff
--- a/src/types/kanban.ts
+++ b/src/types/kanban.ts
@@ -1,6 +1,7 @@
 // src/types/kanban.ts
 export interface KanbanBoard {
   id: string;
+  // user_id is typically a UUID string
   user_id: string;
   title: string;
   description: string | null;
```
**Deviation:** Added a comment to `user_id` in `KanbanBoard` interface to clarify that it's typically a UUID string. This is a minor documentation improvement.
