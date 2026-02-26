export interface KanbanBoard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  card_count: number; // Assuming this is a count of cards in the board
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  user_id: string;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanCard {
  id: string;
  column_id: string;
  board_id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high"; // Example priorities
  due_date: string | null; // YYYY-MM-DD format
  order: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanCardSuggestion {
  cardText: string;
  project: string | null;
  priority: "low" | "medium" | "high" | null;
  dueDate: string | null; // YYYY-MM-DD format
  confidence: number; // AIの提案に対する自信度 (0.0 - 1.0)
}
