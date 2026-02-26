// src/types/kanban.ts
export interface KanbanBoard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  card_count: number; // Example field, adjust as per your DB schema
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  order: number;
  created_at: string;
}

export interface KanbanCard {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  order: number;
  created_at: string;
}
