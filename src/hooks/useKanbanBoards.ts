import { useState, useEffect } from "react";
import { fetchKanbanBoards } from "@/api/kanban";
import { KanbanBoard } from "@/types/kanban";
import { useAuthStore } from "@/stores/authStore"; // To react to auth changes

/**
 * Custom hook to fetch and manage Kanban boards for the authenticated user.
 * @returns {{ boards: KanbanBoard[] | null, loading: boolean, error: Error | null, refetch: () => void }}
 */
export function useKanbanBoards() {
  const [boards, setBoards] = useState<KanbanBoard[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const session = useAuthStore((state) => state.session); // Get session from Zustand

  const getBoards = async () => {
    if (!session) {
      setBoards(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchKanbanBoards();

    if (fetchError) {
      setError(fetchError);
      setBoards(null);
    } else {
      setBoards(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    getBoards();
  }, [session]); // Re-fetch when session changes (e.g., user signs in/out)

  return { boards, loading, error, refetch: getBoards };
}
