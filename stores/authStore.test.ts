import { act, renderHook } from "@testing-library/react-native";
import { useAuthStore } from "./authStore";
import { Session } from "@supabase/supabase-js";

describe("authStore", () => {
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

  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useAuthStore.setState({ session: null });
    });
  });

  it("should return null for session initially", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.session).toBeNull();
  });

  it("should set the session", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setSession(mockSession);
    });

    expect(result.current.session).toEqual(mockSession);
  });

  it("should clear the session", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setSession(mockSession);
    });
    expect(result.current.session).toEqual(mockSession);

    act(() => {
      result.current.clearSession();
    });
    expect(result.current.session).toBeNull();
  });

  it("should update the session when setSession is called multiple times", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setSession(mockSession);
    });
    expect(result.current.session?.user.id).toBe("user123");

    const updatedSession: Session = {
      ...mockSession,
      user: { ...mockSession.user, id: "user456", email: "updated@example.com" },
    };

    act(() => {
      result.current.setSession(updatedSession);
    });
    expect(result.current.session).toEqual(updatedSession);
    expect(result.current.session?.user.id).toBe("user456");
  });
});

