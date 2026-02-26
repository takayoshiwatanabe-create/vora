import { renderHook, waitFor } from "@testing-library/react-native";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

describe("useAuth", () => {
  const mockSetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for onAuthStateChange to immediately return a cleanup function
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (callback: (event: string, session: Session | null) => void) => {
        // Simulate initial session check
        void callback("INITIAL_SESSION", null);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }
    );
  });

  it("fetches initial session and updates state", async () => {
    const mockSession: Session = {
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
      token_type: "Bearer",
      user: {
        id: "user123",
        aud: "authenticated",
        email: "test@example.com",
        created_at: "2023-01-01T00:00:00Z",
        app_metadata: { provider: "email" },
        user_metadata: {},
      },
    };
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    renderHook(() => useAuth(mockSetSession));

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
      expect(mockSetSession).toHaveBeenCalledWith(mockSession);
    });
  });

  it("sets session to null if no initial session is found", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    renderHook(() => useAuth(mockSetSession));

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
      expect(mockSetSession).toHaveBeenCalledWith(null);
    });
  });

  it("subscribes to auth state changes and updates session", async () => {
    const newSession: Session = {
      access_token: "new_access_token",
      refresh_token: "new_refresh_token",
      expires_in: 3600,
      token_type: "Bearer",
      user: {
        id: "user456",
        aud: "authenticated",
        email: "new@example.com",
        created_at: "2023-01-01T00:00:00Z",
        app_metadata: { provider: "email" },
        user_metadata: {},
      },
    };

    let authStateChangeCallback: ((event: string, session: Session | null) => void) | undefined;
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (callback: (event: string, session: Session | null) => void) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }
    );
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    renderHook(() => useAuth(mockSetSession));

    await waitFor(() => expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1));

    // Simulate a SIGN_IN event
    if (authStateChangeCallback) {
      authStateChangeCallback("SIGNED_IN", newSession);
    }

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(newSession);
    });

    // Simulate a SIGN_OUT event
    if (authStateChangeCallback) {
      authStateChangeCallback("SIGNED_OUT", null);
    }

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(null);
    });
  });

  it("cleans up subscription on unmount", async () => {
    const mockUnsubscribe = jest.fn();
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementationOnce(() => ({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    }));
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderHook(() => useAuth(mockSetSession));

    await waitFor(() => expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("handles getSession error gracefully", async () => {
    const mockError = new Error("Failed to get session");
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: mockError,
    });

    renderHook(() => useAuth(mockSetSession));

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
      expect(mockSetSession).toHaveBeenCalledWith(null); // Should still set to null on error
      // Optionally, you might want to mock console.error and check if it was called
      // console.error = jest.fn();
      // expect(console.error).toHaveBeenCalledWith("Error fetching session:", mockError);
    });
  });
});

