import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { VoiceInputButton } from "./voice-input-button";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { t } from "@/i18n";
import { Alert, I18nManager } from "react-native";

// Mock expo-av Audio module
jest.mock("expo-av", () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(() => Promise.resolve()),
      startAsync: jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
      getURI: jest.fn(() => "file://test-audio.m4a"),
    })),
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve("base64encodedaudio")),
  EncodingType: {
    Base64: "base64",
  },
}));

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    auth: {
      signOut: jest.fn(),
    },
  },
}));

// Mock Zustand authStore
jest.mock("@/stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

// Mock i18n-js t function
jest.mock("@/i18n", () => ({
  t: jest.fn((key, options) => {
    switch (key) {
      case "voiceInput.startRecording":
        return "Start Recording";
      case "voiceInput.stopRecording":
        return "Stop Recording";
      case "voiceInput.processingAudio":
        return "Processing Audio...";
      case "voiceInput.permissionDeniedTitle":
        return "Permission Denied";
      case "voiceInput.permissionDeniedMessage":
        return "Microphone permission is required.";
      case "voiceInput.errorTitle":
        return "Error";
      case "voiceInput.startRecordingError":
        return "Failed to start recording.";
      case "voiceInput.stopRecordingError":
        return "Failed to stop recording.";
      case "voiceInput.noTextFound":
        return "No text found in audio.";
      case "api.ai.edgeFunctionError":
        return "AI processing failed.";
      case "api.ai.noCardReturned":
        return "AI did not return a card suggestion.";
      case "voiceInput.successTitle":
        return "Success";
      case "voiceInput.successMessage":
        return `Card created: ${options?.text}`;
      case "voiceInput.processingError":
        return "An error occurred during processing.";
      case "auth.notAuthenticated":
        return "You must be logged in.";
      case "common.error":
        return "Error";
      default:
        return key;
    }
  }),
  isRTL: false, // Default to LTR for tests
}));

// Mock Alert
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    I18nManager: {
      forceRTL: jest.fn(),
      allowRTL: jest.fn(),
      isRTL: false, // Default to false for testing
    },
  };
});

describe("VoiceInputButton", () => {
  const mockOnCardCreated = jest.fn();
  const mockSession = { user: { id: "user-123" } };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({ session: mockSession });
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { cardText: "Test card text" },
      error: null,
    });
    // Reset I18nManager.isRTL to false before each test
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
  });

  it("renders start recording button initially", () => {
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    expect(screen.getByText("Start Recording")).toBeOnTheScreen();
  });

  it("requests microphone permission on mount", () => {
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    expect(Audio.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("shows permission denied alert if permission is not granted", async () => {
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission Denied",
        "Microphone permission is required."
      );
    });
  });

  it("starts recording when button is pressed", async () => {
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording"));

    await waitFor(() => {
      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      expect(Audio.Recording).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Stop Recording")).toBeOnTheScreen();
    });
  });

  it("stops recording and processes audio when button is pressed again", async () => {
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording")); // Start recording

    await waitFor(() => expect(screen.getByText("Stop Recording")).toBeOnTheScreen());

    fireEvent.press(screen.getByText("Stop Recording")); // Stop recording

    await waitFor(() => {
      expect(screen.getByText("Processing Audio...")).toBeOnTheScreen();
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        "file://test-audio.m4a",
        { encoding: "base64" }
      );
      expect(supabase.functions.invoke).toHaveBeenCalledWith("process-voice-input", {
        body: JSON.stringify({ audio: "base64encodedaudio", boardId: undefined }),
        headers: { "Content-Type": "application/json" },
      });
      expect(mockOnCardCreated).toHaveBeenCalledWith("Test card text");
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Card created: Test card text");
      expect(screen.getByText("Start Recording")).toBeOnTheScreen(); // Button returns to idle state
    });
  });

  it("passes boardId to the edge function if provided", async () => {
    render(<VoiceInputButton boardId="board-abc" onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording"));
    await waitFor(() => expect(screen.getByText("Stop Recording")).toBeOnTheScreen());
    fireEvent.press(screen.getByText("Stop Recording"));

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith("process-voice-input", {
        body: JSON.stringify({ audio: "base64encodedaudio", boardId: "board-abc" }),
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  it("shows an error if not authenticated", async () => {
    (useAuthStore as jest.Mock).mockReturnValue({ session: null });
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "You must be logged in.");
      expect(Audio.setAudioModeAsync).not.toHaveBeenCalled();
    });
  });

  it("handles error during audio processing via edge function", async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: "AI service unavailable" },
    });

    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording"));
    await waitFor(() => expect(screen.getByText("Stop Recording")).toBeOnTheScreen());
    fireEvent.press(screen.getByText("Stop Recording"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "AI processing failed.");
      expect(mockOnCardCreated).not.toHaveBeenCalled();
    });
  });

  it("handles no card text returned from edge function", async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { cardText: "" },
      error: null,
    });

    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording"));
    await waitFor(() => expect(screen.getByText("Stop Recording")).toBeOnTheScreen());
    fireEvent.press(screen.getByText("Stop Recording"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "AI did not return a card suggestion.");
      expect(mockOnCardCreated).not.toHaveBeenCalled();
    });
  });

  it("disables button during processing", async () => {
    render(<VoiceInputButton onCardCreated={mockOnCardCreated} />);
    fireEvent.press(screen.getByText("Start Recording"));
    await waitFor(() => expect(screen.getByText("Stop Recording")).toBeOnTheScreen());

    // Simulate processing state
    (supabase.functions.invoke as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { cardText: "Delayed card" }, error: null }), 100))
    );

    fireEvent.press(screen.getByText("Stop Recording"));
    expect(screen.getByText("Processing Audio...")).toBeOnTheScreen();
    // Check if the button itself is disabled, not just the text
    expect(screen.getByLabelText("Processing Audio...")).toHaveProp("accessibilityState", { disabled: true });

    await waitFor(() => expect(screen.getByText("Start Recording")).toBeOnTheScreen());
  });
});

