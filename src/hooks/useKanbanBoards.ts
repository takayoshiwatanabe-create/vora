import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { KanbanBoard } from "@/types/kanban"; // Corrected import path
import { PostgrestError } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchKanbanBoards } from "@/api/kanban";

interface UseKanbanBoardsResult {
  boards: KanbanBoard[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => Promise<void>;
}

export function useKanbanBoards(): UseKanbanBoardsResult {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();

  const queryFn = useCallback(async () => {
    if (!session?.user?.id) {
      return [];
    }
    const { data, error } = await fetchKanbanBoards(session);
    if (error) {
      throw error;
    }
    return data || [];
  }, [session]);

  const {
    data: boards = [],
    isLoading,
    error,
    refetch,
  } = useQuery<KanbanBoard[], PostgrestError>({
    queryKey: ["kanbanBoards", session?.user?.id],
    queryFn: queryFn,
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const manualRefetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["kanbanBoards", session?.user?.id] });
    await refetch();
  }, [queryClient, session?.user?.id, refetch]);

  return {
    boards,
    loading: isLoading,
    error,
    refetch: manualRefetch,
  };
}
