import { renderHook, waitFor } from "@testing-library/react-native";
import { useKanbanBoards } from "./useKanbanBoards";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { KanbanBoard } from "@/types/kanban";

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// Mock Zustand authStore
jest.mock("@/stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useKanbanBoards", () => {
  const mockUserId = "user-123";
  const mockSession = { user: { id: mockUserId } };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({ session: mockSession });
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useKanbanBoards(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.boards).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("fetches kanban boards successfully", async () => {
    const mockBoards: KanbanBoard[] = [
      {
        id: "board-1",
        user_id: mockUserId,
        name: "Board A",
        description: "Desc A",
        created_at: "2023-01-01T00:00:00Z",
        card_count: 5,
      },
      {
        id: "board-2",
        user_id: mockUserId,
        name: "Board B",
        description: "Desc B",
        created_at: "2023-01-02T00:00:00Z",
        card_count: 10,
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockBoards,
            error: null,
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useKanbanBoards(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.boards).toEqual(mockBoards);
    expect(result.current.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith("kanban_boards");
    expect(supabase.from("kanban_boards").select).toHaveBeenCalledWith("*");
    expect(supabase.from("kanban_boards").select().eq).toHaveBeenCalledWith(
      "user_id",
      mockUserId
    );
    expect(supabase.from("kanban_boards").select().eq().order).toHaveBeenCalledWith(
      "created_at",
      { ascending: false }
    );
  });

  it("handles error when fetching kanban boards", async () => {
    const mockError = new Error("Failed to fetch boards");
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: mockError,
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useKanbanBoards(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.boards).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it("does not fetch boards if user is not authenticated", async () => {
    (useAuthStore as jest.Mock).mockReturnValue({ session: null });

    const { result } = renderHook(() => useKanbanBoards(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.boards).toEqual([]);
    expect(result.current.error).toBeNull(); // No error, just no fetch
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("refetches boards when refetch is called", async () => {
    const mockBoards1: KanbanBoard[] = [
      {
        id: "board-1",
        user_id: mockUserId,
        name: "Board A",
        description: "Desc A",
        created_at: "2023-01-01T00:00:00Z",
        card_count: 5,
      },
    ];
    const mockBoards2: KanbanBoard[] = [
      ...mockBoards1,
      {
        id: "board-3",
        user_id: mockUserId,
        name: "Board C",
        description: "Desc C",
        created_at: "2023-01-03T00:00:00Z",
        card_count: 7,
      },
    ];

    // First fetch
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockBoards1,
            error: null,
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useKanbanBoards(), { wrapper });

    await waitFor(() => expect(result.current.boards).toEqual(mockBoards1));

    // Second fetch (refetch)
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockBoards2,
            error: null,
          })),
        })),
      })),
    });

    await result.current.refetch();

    await waitFor(() => expect(result.current.boards).toEqual(mockBoards2));
    expect(supabase.from).toHaveBeenCalledTimes(2); // Called twice for two fetches
  });
});

