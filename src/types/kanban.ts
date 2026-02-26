// src/types/kanban.ts
export interface KanbanBoard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  card_count: number;
}

export interface KanbanCard {
  id: string;
  board_id: string;
  column_id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
  priority: "low" | "medium" | "high";
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  user_id: string;
  name: string;
  order: number;
  created_at: string;
}

