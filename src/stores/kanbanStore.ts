import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KanbanBoard, KanbanCard } from "@/types/kanban";

// Define the structure for an offline change
interface OfflineKanbanChange {
  type: "insert" | "update" | "delete";
  data: KanbanCard;
  boardId: string;
}

interface KanbanState {
  boards: Record<string, KanbanBoard>; // Store boards by ID for easy access
  cards: Record<string, Record<string, KanbanCard>>; // Store cards by boardId then cardId
  offlineChanges: OfflineKanbanChange[]; // Array to store pending offline changes

  // Board actions
  setBoards: (boardsArray: KanbanBoard[]) => void;
  addBoard: (board: KanbanBoard) => void;
  updateBoard: (board: KanbanBoard) => void;
  deleteBoard: (boardId: string) => void;

  // Card actions
  setCards: (boardId: string, cardsArray: KanbanCard[]) => void;
  addCard: (boardId: string, card: KanbanCard) => void;
  updateCard: (boardId: string, card: KanbanCard) => void;
  deleteCard: (boardId: string, cardId: string) => void;

  // Offline actions
  addOfflineChange: (change: OfflineKanbanChange) => void;
  clearOfflineChanges: (successfulChanges: OfflineKanbanChange[]) => void;
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      boards: {},
      cards: {},
      offlineChanges: [],

      setBoards: (boardsArray) => {
        const newBoards: Record<string, KanbanBoard> = {};
        boardsArray.forEach((board) => {
          newBoards[board.id] = board;
        });
        set({ boards: newBoards });
      },
      addBoard: (board) =>
        set((state) => ({
          boards: {
            ...state.boards,
            [board.id]: board,
          },
        })),
      updateBoard: (board) =>
        set((state) => ({
          boards: {
            ...state.boards,
            [board.id]: { ...state.boards[board.id], ...board },
          },
        })),
      deleteBoard: (boardId) =>
        set((state) => {
          const newBoards = { ...state.boards };
          delete newBoards[boardId];
          const newCards = { ...state.cards };
          delete newCards[boardId]; // Also delete cards associated with the board
          return { boards: newBoards, cards: newCards };
        }),

      setCards: (boardId, cardsArray) => {
        const newCardsForBoard: Record<string, KanbanCard> = {};
        cardsArray.forEach((card) => {
          newCardsForBoard[card.id] = card;
        });
        set((state) => ({
          cards: {
            ...state.cards,
            [boardId]: newCardsForBoard,
          },
        }));
      },
      addCard: (boardId, card) =>
        set((state) => ({
          cards: {
            ...state.cards,
            [boardId]: {
              ...(state.cards[boardId] || {}),
              [card.id]: card,
            },
          },
        })),
      updateCard: (boardId, card) =>
        set((state) => ({
          cards: {
            ...state.cards,
            [boardId]: {
              ...(state.cards[boardId] || {}),
              [card.id]: { ...state.cards[boardId]?.[card.id], ...card },
            },
          },
        })),
      deleteCard: (boardId, cardId) =>
        set((state) => {
          const newCardsForBoard = { ...(state.cards[boardId] || {}) };
          delete newCardsForBoard[cardId];
          return {
            cards: {
              ...state.cards,
              [boardId]: newCardsForBoard,
            },
          };
        }),

      addOfflineChange: (change) =>
        set((state) => ({
          offlineChanges: [...state.offlineChanges, change],
        })),
      clearOfflineChanges: (successfulChanges) =>
        set((state) => ({
          offlineChanges: state.offlineChanges.filter(
            (change) =>
              !successfulChanges.some(
                (sChange) =>
                  sChange.boardId === change.boardId &&
                  sChange.type === change.type &&
                  sChange.data.id === change.data.id
              )
          ),
        })),
    }),
    {
      name: "kanban-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        offlineChanges: state.offlineChanges,
        // Only persist offlineChanges, as boards/cards will be synced from Supabase
        // on app load and managed by Realtime/TanStack Query.
        // Persisting boards/cards here would duplicate data and potentially cause conflicts.
      }),
    }
  )
);
