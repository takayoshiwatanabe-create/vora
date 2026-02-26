import { supabase } from "@/lib/supabase";
import { KanbanBoard, KanbanCard } from "@/types/kanban";
import { Session } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";
import { KanbanCardSuggestion } from "@/types/kanban";
import { t } from "@/i18n";

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
  return { data: data as KanbanBoard[], error: null };
}

/**
 * Creates a new Kanban card based on the AI suggestion.
 * @param suggestion The Kanban card suggestion from AI.
 * @param boardId The ID of the board where the card should be created.
 * @param userId The ID of the user creating the card.
 * @returns A promise that resolves to the created Kanban card or an error.
 */
export async function createKanbanCard(
  suggestion: KanbanCardSuggestion,
  boardId: string,
  userId: string
): Promise<{ data: KanbanCard | null; error: PostgrestError | null }> {
  // For simplicity, we'll assume a default column for now.
  // In a real app, you'd fetch or determine the correct column_id.
  // For now, let's assume the first column of the board.
  // This needs to be implemented properly later.
  const { data: columns, error: columnError } = await supabase
    .from("kanban_columns")
    .select("id")
    .eq("board_id", boardId)
    .order("order", { ascending: true })
    .limit(1);

  if (columnError) {
    console.error("Error fetching kanban columns:", columnError.message);
    return { data: null, error: columnError };
  }

  if (!columns || columns.length === 0) {
    return { data: null, error: { message: t("kanban.noColumnsFound"), code: "404", details: null, hint: null } as PostgrestError };
  }

  const columnId = columns[0].id;

  const { data, error } = await supabase
    .from("kanban_cards")
    .insert({
      board_id: boardId,
      column_id: columnId, // Use the fetched column ID
      user_id: userId,
      title: suggestion.cardText,
      description: suggestion.project ? `Project: ${suggestion.project}` : null, // Combine project into description for now
      priority: suggestion.priority || "medium", // Default to medium if null
      due_date: suggestion.dueDate,
      order: 0, // Default order, will need proper ordering logic later
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating Kanban card:", error.message);
    return { data: null, error };
  }

  return { data: data as KanbanCard, error: null };
}

/**
 * Updates an existing Kanban card.
 * @param cardId The ID of the card to update.
 * @param updates The partial KanbanCard object with fields to update.
 * @returns A promise that resolves to the updated Kanban card or an error.
 */
export async function updateKanbanCard(
  cardId: string,
  updates: Partial<KanbanCard>
): Promise<{ data: KanbanCard | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("kanban_cards")
    .update(updates)
    .eq("id", cardId)
    .select()
    .single();

  if (error) {
    console.error("Error updating Kanban card:", error.message);
    return { data: null, error };
  }

  return { data: data as KanbanCard, error: null };
}

/**
 * Deletes a Kanban card.
 * @param cardId The ID of the card to delete.
 * @returns A promise that resolves to true on success or an error.
 */
export async function deleteKanbanCard(
  cardId: string
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const { error } = await supabase
    .from("kanban_cards")
    .delete()
    .eq("id", cardId);

  if (error) {
    console.error("Error deleting Kanban card:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}

