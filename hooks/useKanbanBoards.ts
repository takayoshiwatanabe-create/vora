import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { KanbanBoard } from "@/src/types/kanban"; // Use the type from src/types
import { PostgrestError } from "@supabase/supabase-js"; // Import PostgrestError

interface UseKanbanBoardsResult {
  boards: KanbanBoard[]; // Should always be an array, even if empty
  loading: boolean;
  error: PostgrestError | null; // Changed error type to PostgrestError
  refetch: () => Promise<void>;
}

export function useKanbanBoards(): UseKanbanBoardsResult {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Initialize as true to show loading on first fetch
  const [error, setError] = useState<PostgrestError | null>(null); // Changed error type
  const session = useAuthStore((state) => state.session);

  const fetchBoards = useCallback(async (): Promise<void> => {
    if (!session) {
      setBoards([]);
      setLoading(false);
      setError(null); // Clear error if no session
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("kanban_boards")
        .select("id, user_id, name, description, created_at, card_count") // Explicitly select fields
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      setBoards(data || []);
    } catch (err: unknown) {
      // Ensure error is of type PostgrestError or convert to a generic Error
      // PostgrestError has 'message', 'code', 'details', 'hint'
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
  }, [session]);

  useEffect(() => {
    void fetchBoards(); // Use void to ignore the Promise
  }, [fetchBoards]);

  return { boards, loading, error, refetch: fetchBoards }; // Ensure boards is always an array
}

