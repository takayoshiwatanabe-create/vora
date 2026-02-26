import { supabase } from "@/lib/supabase";
import { KanbanBoard, KanbanCard } from "@/types/kanban";

/**
 * Fetches all Kanban boards for the current user.
 * @returns A promise that resolves to an array of KanbanBoard objects.
 */
export async function fetchKanbanBoards(): Promise<KanbanBoard[]> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select("id, user_id, name, description, created_at, card_count") // Explicitly select columns
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Kanban boards:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetches cards for a specific Kanban board.
 * @param boardId The ID of the Kanban board.
 * @returns A promise that resolves to an array of KanbanCard objects.
 */
export async function fetchKanbanCards(boardId: string): Promise<KanbanCard[]> {
  const { data, error } = await supabase
    .from("kanban_cards")
    .select("id, board_id, title, description, status, priority, due_date, created_at") // Explicitly select all columns from spec
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching Kanban cards for board ${boardId}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Creates a new Kanban card.
 * @param cardData The data for the new card (title, description, board_id, status).
 * @returns A promise that resolves to the newly created KanbanCard object.
 */
export async function createKanbanCard(
  cardData: Omit<KanbanCard, "id" | "created_at">
): Promise<KanbanCard> {
  const { data, error } = await supabase
    .from("kanban_cards")
    .insert([cardData])
    .select("id, board_id, title, description, status, priority, due_date, created_at") // Select all fields after insert
    .single();

  if (error) {
    console.error("Error creating Kanban card:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to retrieve created card data.");
  }

  return data;
}

/**
 * Updates an existing Kanban card.
 * @param cardId The ID of the card to update.
 * @param updates The fields to update.
 * @returns A promise that resolves to the updated KanbanCard object.
 */
export async function updateKanbanCard(
  cardId: string,
  updates: Partial<Omit<KanbanCard, "id" | "created_at" | "board_id">>
): Promise<KanbanCard> {
  const { data, error } = await supabase
    .from("kanban_cards")
    .update(updates)
    .eq("id", cardId)
    .select("id, board_id, title, description, status, priority, due_date, created_at") // Select all fields after update
    .single();

  if (error) {
    console.error(`Error updating Kanban card ${cardId}:`, error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to retrieve updated card data.");
  }

  return data;
}

/**
 * Deletes a Kanban card.
 * @param cardId The ID of the card to delete.
 * @returns A promise that resolves when the card is deleted.
 */
export async function deleteKanbanCard(cardId: string): Promise<void> {
  const { error } = await supabase.from("kanban_cards").delete().eq("id", cardId);

  if (error) {
    console.error(`Error deleting Kanban card ${cardId}:`, error);
    throw error;
  }
}
