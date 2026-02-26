import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useKanbanStore } from "@/stores/kanbanStore"; // Corrected import path
import { KanbanBoard, KanbanCard } from "@/types/kanban"; // Corrected import path
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { t } from "@/i18n";

/**
 * Custom hook to set up real-time synchronization for Kanban boards and cards.
 * It subscribes to Supabase Realtime changes and updates the Zustand store and TanStack Query cache.
 * @param boardId Optional board ID to subscribe to specific card changes. If not provided, only board changes are tracked.
 */
export function useRealtimeKanban(boardId?: string): void {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();
  const { addBoard, updateBoard, deleteBoard, addCard, updateCard, deleteCard } = useKanbanStore();

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const userId = session.user.id;

    // Realtime for Kanban Boards
    const boardsChannel = supabase
      .channel(`kanban_boards_for_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kanban_boards",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newBoard = payload.new as KanbanBoard | undefined;
          const oldBoard = payload.old as KanbanBoard | undefined;

          switch (payload.eventType) {
            case "INSERT":
              if (newBoard) {
                addBoard(newBoard);
                void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", userId] });
              }
              break;
            case "UPDATE":
              if (newBoard) {
                updateBoard(newBoard);
                void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", userId] });
                void queryClient.invalidateQueries({ queryKey: ["kanbanBoard", newBoard.id] });
              }
              break;
            case "DELETE":
              if (oldBoard) {
                deleteBoard(oldBoard.id);
                void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", userId] });
                void queryClient.invalidateQueries({ queryKey: ["kanbanBoard", oldBoard.id] });
                void queryClient.invalidateQueries({ queryKey: ["kanbanCards", oldBoard.id] });
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Supabase Realtime boards channel error.");
          Alert.alert(t("common.error"), t("realtime.boardsChannelError"));
        }
      });

    // Realtime for Kanban Cards (if boardId is provided)
    let cardsChannel: ReturnType<typeof supabase.channel> | undefined;
    if (boardId) {
      cardsChannel = supabase
        .channel(`kanban_cards_for_board_${boardId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "kanban_cards",
            filter: `board_id=eq.${boardId}`,
          },
          (payload) => {
            const newCard = payload.new as KanbanCard | undefined;
            const oldCard = payload.old as KanbanCard | undefined;

            switch (payload.eventType) {
              case "INSERT":
                if (newCard) {
                  addCard(boardId, newCard);
                  void queryClient.invalidateQueries({ queryKey: ["kanbanCards", boardId] });
                }
                break;
              case "UPDATE":
                if (newCard) {
                  updateCard(boardId, newCard);
                  void queryClient.invalidateQueries({ queryKey: ["kanbanCards", boardId] });
                }
                break;
              case "DELETE":
                if (oldCard) {
                  deleteCard(boardId, oldCard.id);
                  void queryClient.invalidateQueries({ queryKey: ["kanbanCards", boardId] });
                }
                break;
            }
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(`Supabase Realtime cards channel error for board ${boardId}.`);
            Alert.alert(t("common.error"), t("realtime.cardsChannelError", { boardId }));
          }
        });
    }

    return () => {
      void boardsChannel.unsubscribe();
      if (cardsChannel) {
        void cardsChannel.unsubscribe();
      }
    };
  }, [session, boardId, queryClient, addBoard, updateBoard, deleteBoard, addCard, updateCard, deleteCard]);
}

