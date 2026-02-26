import React from "react";
import { render, screen } from "@testing-library/react-native";
import { UserProfile } from "./user-profile";
import { User } from "@supabase/supabase-js";
import { Image, I18nManager } from "react-native";

// Mock i18n-js t function
jest.mock("@/i18n", () => ({
  t: jest.fn((key, options) => {
    if (key === "settings.userIdDisplay") {
      return `User ID: ${options?.id}`;
    }
    return key; // Fallback for other keys
  }),
  isRTL: false, // Default to LTR for tests
}));

// Mock Image component to allow testing its props
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...RN,
    Image: jest.fn((props) => <RN.Image {...props} testID="Image" />),
    I18nManager: {
      forceRTL: jest.fn(),
      allowRTL: jest.fn(),
      isRTL: false, // Default to false for testing
    },
  };
});

describe("UserProfile", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    user_metadata: {
      full_name: "John Doe",
      avatar_url: "https://example.com/avatar.png",
    },
    aud: "authenticated",
    created_at: "2023-01-01T00:00:00Z",
    app_metadata: { provider: "email" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset i18n mock to default LTR for each test
    jest.doMock("@/i18n", () => ({
      t: jest.fn((key, options) => {
        if (key === "settings.userIdDisplay") {
          return `User ID: ${options?.id}`;
        }
        return key; // Fallback for other keys
      }),
      isRTL: false,
    }));
    // Reset I18nManager.isRTL to false before each test
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
  });

  it("renders user profile with avatar, full name, email, and user ID", () => {
    render(<UserProfile user={mockUser} />);

    expect(screen.getByText("John Doe")).toBeOnTheScreen();
    expect(screen.getByText("test@example.com")).toBeOnTheScreen();
    expect(screen.getByText("User ID: user-123")).toBeOnTheScreen();
    expect(screen.getByTestId("Image")).toHaveProp("source", {
      uri: "https://example.com/avatar.png",
    });
  });

  it("renders avatar placeholder if avatar_url is missing", () => {
    const userWithoutAvatar = { ...mockUser, user_metadata: { full_name: "Jane Doe" } };
    render(<UserProfile user={userWithoutAvatar} />);

    expect(screen.queryByTestId("Image")).toBeNull();
    expect(screen.getByText("J")).toBeOnTheScreen(); // First letter of full_name
  });

  it("renders avatar placeholder with first letter of email if full_name is missing and no avatar_url", () => {
    const userMinimal = { ...mockUser, user_metadata: {}, email: "minimal@example.com" };
    render(<UserProfile user={userMinimal} />);

    expect(screen.queryByTestId("Image")).toBeNull();
    expect(screen.getByText("M")).toBeOnTheScreen(); // First letter of email
  });

  it("renders email as display name if full_name is missing", () => {
    const userWithoutFullName = { ...mockUser, user_metadata: { avatar_url: "https://example.com/avatar.png" } };
    render(<UserProfile user={userWithoutFullName} />);

    expect(screen.getByText("test@example.com")).toBeOnTheScreen();
  });

  it("applies RTL styles when isRTL is true", () => {
    // Override isRTL for this specific test
    jest.doMock("@/i18n", () => ({
      t: jest.fn((key, options) => {
        if (key === "settings.userIdDisplay") {
          return `User ID: ${options?.id}`;
        }
        return key; // Fallback for other keys
      }),
      isRTL: true,
    }));
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });


    // Re-import the component to pick up the new mock
    const { UserProfile: RTLUserProfile } = require("./user-profile");
    const { getByText } = render(<RTLUserProfile user={mockUser} />);

    // Check if the style prop contains textAlign: 'right' for RTL text
    expect(getByText("John Doe").props.style).toContainEqual({
      textAlign: "right",
    });
    expect(getByText("test@example.com").props.style).toContainEqual({
      textAlign: "right",
    });
  });
});

