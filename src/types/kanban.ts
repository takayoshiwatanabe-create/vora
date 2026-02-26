// src/types/kanban.ts
export interface KanbanBoard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  card_count: number; // Assuming this is a count of cards in the board
}

export interface KanbanCard {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in-progress" | "done"; // Example statuses
  created_at: string;
}
