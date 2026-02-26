// src/types/kanban.ts
export interface KanbanBoard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface KanbanCard {
  id: string;
  column_id: string;
  user_id: string;
  title: string;
  description: string | null;
  order_index: number;
  ai_confidence_score: number | null;
  created_at: string;
  due_date: string | null; // ISO 8601 date string
  tags: string[] | null;
}
