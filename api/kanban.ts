import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

// Define a type for KanbanBoard
export type KanbanBoard = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
};

// Define a type for KanbanCard (simplified for now)
export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  status: string; // e.g., 'todo', 'in-progress', 'done'
  board_id: string;
  user_id: string;
  created_at: string;
};

/**
 * Fetches all Kanban boards for the current user.
 * @param session The current Supabase session.
 * @returns A promise that resolves to an array of KanbanBoard or null if no session.
 */
export async function fetchKanbanBoards(session: Session | null): Promise<KanbanBoard[] | null> {
  if (!session) {
    console.warn("No session found, cannot fetch Kanban boards.");
    return null;
  }

  const { data, error } = await supabase
    .from("kanban_boards")
    .select("id, name, description, created_at, user_id")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Kanban boards:", error);
    throw new Error(error.message);
  }

  return data as KanbanBoard[];
}

/**
 * Fetches all Kanban cards for a specific board.
 * @param boardId The ID of the Kanban board.
 * @param session The current Supabase session.
 * @returns A promise that resolves to an array of KanbanCard.
 */
export async function fetchKanbanCards(boardId: string, session: Session | null): Promise<KanbanCard[]> {
  if (!session) {
    console.warn("No session found, cannot fetch Kanban cards.");
    return [];
  }

  const { data, error } = await supabase
    .from("kanban_cards")
    .select("id, title, description, status, board_id, user_id, created_at")
    .eq("board_id", boardId)
    .eq("user_id", session.user.id) // Ensure RLS is respected
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Error fetching Kanban cards for board ${boardId}:`, error);
    throw new Error(error.message);
  }

  return data as KanbanCard[];
}

/**
 * Creates a new Kanban board.
 * @param name The name of the new board.
 * @param description An optional description for the board.
 * @param session The current Supabase session.
 * @returns A promise that resolves to the newly created KanbanBoard.
 */
export async function createKanbanBoard(name: string, description: string | undefined, session: Session | null): Promise<KanbanBoard> {
  if (!session) {
    throw new Error("No session found, cannot create Kanban board.");
  }

  const { data, error } = await supabase
    .from("kanban_boards")
    .insert({ name, description, user_id: session.user.id })
    .select("id, name, description, created_at, user_id")
    .single();

  if (error) {
    console.error("Error creating Kanban board:", error);
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Failed to create Kanban board: No data returned.");
  }
  return data as KanbanBoard;
}

/**
 * Creates a new Kanban card.
 * @param title The title of the new card.
 * @param boardId The ID of the board the card belongs to.
 * @param status The initial status of the card (e.g., 'todo').
 * @param description An optional description for the card.
 * @param session The current Supabase session.
 * @returns A promise that resolves to the newly created KanbanCard.
 */
export async function createKanbanCard(title: string, boardId: string, status: string, description: string | undefined, session: Session | null): Promise<KanbanCard> {
  if (!session) {
    throw new Error("No session found, cannot create Kanban card.");
  }

  const { data, error } = await supabase
    .from("kanban_cards")
    .insert({ title, board_id: boardId, status, description, user_id: session.user.id })
    .select("id, title, description, status, board_id, user_id, created_at")
    .single();

  if (error) {
    console.error("Error creating Kanban card:", error);
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Failed to create Kanban card: No data returned.");
  }
  return data as KanbanCard;
}

