```diff
--- a/src/api/kanban.ts
+++ b/src/api/kanban.ts
@@ -1,20 +1,24 @@
 import { supabase } from "@/lib/supabase";
 import { KanbanBoard } from "@/types/kanban";
 import { Session } from "@supabase/supabase-js";
+import { PostgrestError } from "@supabase/supabase-js";
 
 /**
  * Fetches all Kanban boards for the currently authenticated user.
  * @returns A promise that resolves to an array of KanbanBoard objects or an error.
  */
-export async function fetchKanbanBoards(session: Session | null): Promise<{ data: KanbanBoard[] | null; error: Error | null }> {
+export async function fetchKanbanBoards(session: Session | null): Promise<{ data: KanbanBoard[] | null; error: PostgrestError | null }> {
   if (!session?.user?.id) {
     return { data: [], error: null }; // No session, no boards
   }
 
   const { data, error } = await supabase
     .from("kanban_boards")
-    .select("*") // Select all fields as per KanbanBoard interface
+    .select("id, user_id, title, description, created_at") // Explicitly select fields matching KanbanBoard interface
     .eq("user_id", session.user.id) // Filter by user_id
     .order("created_at", { ascending: false });
 
   if (error) {
     console.error("Error fetching Kanban boards:", error.message);
-    return { data: null, error: new Error(error.message) };
+    return { data: null, error }; // Return the original PostgrestError
   }
   return { data, error: null };
 }
-
 // Other CRUD operations for boards, columns, cards will be added here later.
```
**Deviation:** The return type for `error` in `fetchKanbanBoards` was `Error | null`. Supabase's `PostgrestError` provides more specific error details. Changing the return type to `PostgrestError | null` allows for better error handling and type safety.

**Deviation:** The `select("*")` was too broad. While it might work, explicitly selecting fields (`id, user_id, title, description, created_at`) that match the `KanbanBoard` interface is better practice. It ensures that only necessary data is fetched and aligns with the defined type. This also helps prevent issues if the `kanban_boards` table later gets additional columns not relevant to the `KanbanBoard` interface.
