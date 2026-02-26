// src/types/kanban.ts
export interface KanbanBoard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  card_count: number; // Denormalized count for display
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  title: string;
  order: number;
  created_at: string;
}

export interface KanbanCard {
  id: string;
  board_id: string;
  column_id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null; // ISO 8601 format
  order: number;
  created_at: string;
  updated_at: string;
}

// Type for AI-suggested card information
export interface KanbanCardSuggestion {
  cardText: string;
  project: string | null;
  priority: "low" | "medium" | "high" | null;
  dueDate: string | null; // ISO 8601 format
}
