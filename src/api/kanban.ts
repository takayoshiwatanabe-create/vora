import { supabase } from "@/lib/supabase";
import { KanbanBoard } from "@/types/kanban";

/**
 * Fetches all Kanban boards for the currently authenticated user.
 * @returns A promise that resolves to an array of KanbanBoard objects or an error.
 */
export async function fetchKanbanBoards(): Promise<{ data: KanbanBoard[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select("id, user_id, title, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Kanban boards:", error.message);
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// Other CRUD operations for boards, columns, cards will be added here later.
