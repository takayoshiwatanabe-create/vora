import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { KanbanBoard } from "@/types/kanban"; // Use the type from src/types
import { PostgrestError } from "@supabase/supabase-js"; // Import PostgrestError
import { useQuery } from "@tanstack/react-query";
import { fetchKanbanBoards } from "@/api/kanban";

interface UseKanbanBoardsResult {
  boards: KanbanBoard[]; // Should always be an array, even if empty
  loading: boolean;
  error: PostgrestError | null; // Changed error type to PostgrestError
  refetch: () => Promise<void>;
}

export function useKanbanBoards(): UseKanbanBoardsResult {
  const session = useAuthStore((state) => state.session);

  const { data, isLoading, error, refetch } = useQuery<KanbanBoard[], PostgrestError>({
    queryKey: ["kanbanBoards", session?.user?.id],
    queryFn: async () => {
      const { data, error: fetchError } = await fetchKanbanBoards(session);
      if (fetchError) {
        throw fetchError;
      }
      return data || [];
    },
    enabled: !!session?.user?.id, // Only run query if session and user ID exist
    initialData: [], // Ensure data is always an array
  });

  return {
    boards: data || [],
    loading: isLoading,
    error: error || null,
    refetch: async () => { await refetch(); },
  };
}
