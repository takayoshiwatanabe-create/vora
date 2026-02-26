// src/types/kanban.ts

export type KanbanCardStatus = "todo" | "in_progress" | "done";

export interface KanbanBoard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  card_count: number; // Denormalized count for display
}

export interface KanbanCard {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  status: KanbanCardStatus;
  created_at: string;
}

