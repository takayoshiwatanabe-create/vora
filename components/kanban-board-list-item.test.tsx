import React from "react";
import { render, screen } from "@testing-library/react-native";
import { KanbanBoardListItem } from "./kanban-board-list-item";
import { KanbanBoard } from "@/types/kanban";
import { useRouter } from "expo-router";
import { I18nManager } from "react-native";

// Mock expo-router's useRouter and Link
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    // Use a TouchableOpacity to simulate the Link's touchable behavior for testing
    <mock-link href={href} testID={href}>
      {children}
    </mock-link>
  ),
}));

// Mock i18n-js t function
jest.mock("@/i18n", () => ({
  t: jest.fn((key, options) => {
    if (key === "kanban.boardCreated") {
      return `Created on ${options?.date}`;
    }
    if (key === "kanban.boardItemDescription") {
      return `${options?.count} cards`;
    }
    return key; // Fallback for other keys
  }),
  isRTL: false, // Default to LTR for tests
  lang: "en", // Default language for tests
}));

describe("KanbanBoardListItem", () => {
  const mockBoard: KanbanBoard = {
    id: "board-123",
    user_id: "user-abc",
    name: "My Test Board",
    description: "A board for testing purposes",
    created_at: "2023-01-15T10:00:00Z",
    card_count: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    // Reset i18n mock to default LTR for each test
    jest.doMock("@/i18n", () => ({
      t: jest.fn((key, options) => {
        if (key === "kanban.boardCreated") {
          return `Created on ${options?.date}`;
        }
        if (key === "kanban.boardItemDescription") {
          return `${options?.count} cards`;
        }
        return key; // Fallback for other keys
      }),
      isRTL: false,
      lang: "en",
    }));
    // Reset I18nManager.isRTL to false before each test
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
  });

  it("renders board details correctly", () => {
    render(<KanbanBoardListItem board={mockBoard} />);

    expect(screen.getByText("My Test Board")).toBeOnTheScreen();
    expect(screen.getByText("A board for testing purposes")).toBeOnTheScreen();
    expect(screen.getByText("Created on Jan 15, 2023")).toBeOnTheScreen();
    expect(screen.getByText("5 cards")).toBeOnTheScreen();
  });

  it("navigates to the correct board detail page on press", () => {
    render(<KanbanBoardListItem board={mockBoard} />);
    const linkElement = screen.getByTestId("/(main)/kanban/board-123"); // Use testID from mock-link

    expect(linkElement).toHaveProp("href", "/(main)/kanban/board-123");
  });

  it("does not render description if it's null or empty", () => {
    const boardWithoutDescription = { ...mockBoard, description: null };
    render(<KanbanBoardListItem board={boardWithoutDescription} />);

    expect(screen.queryByText("A board for testing purposes")).toBeNull();
  });

  it("applies RTL styles when isRTL is true", () => {
    // Override isRTL for this specific test
    jest.doMock("@/i18n", () => ({
      t: jest.fn((key, options) => {
        if (key === "kanban.boardCreated") {
          return `Created on ${options?.date}`;
        }
        if (key === "kanban.boardItemDescription") {
          return `${options?.count} cards`;
        }
        return key; // Fallback for other keys
      }),
      isRTL: true,
      lang: "ar", // Set a RTL language for consistency
    }));
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });


    // Re-import the component to pick up the new mock
    const { KanbanBoardListItem: RTLKanbanBoardListItem } = require("./kanban-board-list-item");
    const { getByText } = render(<RTLKanbanBoardListItem board={mockBoard} />);

    // Check if the style prop contains textAlign: 'right' for RTL text
    // This is a shallow check; deep style comparison might require more advanced matchers.
    expect(getByText("My Test Board").props.style).toContainEqual({
      textAlign: "right",
    });
    expect(getByText("A board for testing purposes").props.style).toContainEqual({
      textAlign: "right",
    });
  });
});

