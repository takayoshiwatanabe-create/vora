import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { KanbanBoard } from "@/types/kanban";
import { PostgrestError } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

interface UseKanbanBoardsResult {
  boards: KanbanBoard[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => Promise<void>;
}

export function useKanbanBoards(): UseKanbanBoardsResult {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient(); // Initialize query client

  const fetchBoards = useCallback(async (): Promise<void> => {
    if (!session) {
      setBoards([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("kanban_boards")
        .select("id, user_id, name, description, created_at, card_count")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      setBoards(data || []);
      // Invalidate TanStack Query cache for boards after fetching
      void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", session.user.id] });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        const postgrestError: PostgrestError = {
          message: (err as { message: string }).message,
          code: (err as { code?: string }).code || 'UNKNOWN_ERROR',
          details: (err as { details?: string }).details || '',
          hint: (err as { hint?: string }).hint || '',
        };
        setError(postgrestError);
      } else {
        setError({ message: String(err), code: 'UNKNOWN_ERROR', details: '', hint: '' });
      }
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, [session, queryClient]); // Add queryClient to dependencies

  useEffect(() => {
    void fetchBoards();
  }, [fetchBoards]);

  return { boards, loading, error, refetch: fetchBoards };
}
