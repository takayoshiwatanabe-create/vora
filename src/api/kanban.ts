import { supabase } from "@/lib/supabase";
import { KanbanBoard } from "@/src/types/kanban";
import { Session } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Fetches all Kanban boards for the currently authenticated user.
 * @returns A promise that resolves to an array of KanbanBoard objects or an error.
 */
export async function fetchKanbanBoards(session: Session | null): Promise<{ data: KanbanBoard[] | null; error: PostgrestError | null }> {
  if (!session?.user?.id) {
    return { data: [], error: null }; // No session, no boards
  }

  const { data, error } = await supabase
    .from("kanban_boards")
    .select("id, user_id, name, description, created_at, card_count") // Explicitly select fields matching KanbanBoard interface
    .eq("user_id", session.user.id) // Filter by user_id
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Kanban boards:", error.message);
    return { data: null, error }; // Return the original PostgrestError
  }
  return { data, error: null };
}
// Other CRUD operations for boards, columns, cards will be added here later.
