import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { t, isRTL } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { processAudioWithAI } from "@/api/ai";
import { createKanbanCard } from "@/api/kanban";
import { AiSuggestionModal } from "@/components/ai-suggestion-modal";
import { KanbanCardSuggestion } from "@/types/kanban";
import { useVoiceRecording } from "@/hooks/useVoiceRecording"; // Import the custom hook

interface VoiceInputButtonProps {
  boardId?: string; // Optional boardId for creating cards in a specific board
  onCardCreated: (cardText: string) => void;
}

export function VoiceInputButton({
  boardId,
  onCardCreated,
}: VoiceInputButtonProps): JSX.Element {
  const {
    isRecording,
    recordingDuration,
    audioUri,
    startRecording,
    stopRecording,
    clearRecording,
    requestPermission, // Added from hook
    permissionResponse, // Added from hook
  } = useVoiceRecording();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [suggestionModalVisible, setSuggestionModalVisible] =
    useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] =
    useState<KanbanCardSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    // Request microphone permission on component mount
    void requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const handleAudioProcessing = async (): Promise<void> => {
      if (audioUri) {
        setIsProcessing(true);
        setAiError(null);
        setAiSuggestion(null);

        if (!session?.access_token || !session?.user?.id) {
          Alert.alert(t("common.error"), t("auth.notAuthenticated"));
          setIsProcessing(false);
          clearRecording();
          return;
        }

        try {
          // Convert audioUri to Blob for fetch API
          const response = await fetch(audioUri);
          const audioBlob = await response.blob();

          const aiResponse = await processAudioWithAI(audioBlob, boardId);

          if (aiResponse.suggestion) {
            setAiSuggestion(aiResponse.suggestion);
            // AI Confidence First: If confidence is low or specific conditions, show modal
            // The spec states: "AIが自信を持てる時のみ自動実行。不確かな時はユーザーへ確認"
            // For now, we always show the modal for user confirmation, assuming the AI might be uncertain
            // or the user might want to refine the suggestion.
            setSuggestionModalVisible(true);
          } else {
            // If AI returns no suggestion, show an error message.
            setAiError(aiResponse.message || t("api.ai.noCardReturned"));
            setSuggestionModalVisible(true); // Show modal with error message
          }
        } catch (err: unknown) {
          console.error("Error processing audio:", err);
          setAiError(
            (err instanceof Error) ? err.message : t("voiceInput.processingError")
          );
          setSuggestionModalVisible(true); // Show modal with error message
        } finally {
          setIsProcessing(false);
          clearRecording(); // Clear the temporary audio file after processing
        }
      }
    };

    void handleAudioProcessing();
  }, [audioUri, session, boardId, clearRecording]);

  const handleConfirmSuggestion = async (
    confirmedSuggestion: KanbanCardSuggestion
  ): Promise<void> => {
    if (!session?.user?.id) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      return;
    }
    if (!boardId) {
      Alert.alert(t("common.error"), t("kanban.noBoardSelected")); // New translation key needed
      return;
    }

    setSuggestionModalVisible(false);
    setIsProcessing(true); // Indicate that card creation is in progress

    try {
      const { data, error } = await createKanbanCard(
        confirmedSuggestion,
        boardId,
        session.user.id
      );

      if (error) {
        Alert.alert(t("common.error"), error.message);
      } else if (data) {
        Alert.alert(
          t("voiceInput.successTitle"),
          t("voiceInput.successMessage", { text: data.title })
        );
        onCardCreated(data.title);
      }
    } catch (err: unknown) {
      console.error("Error creating card:", err);
      Alert.alert(
        t("common.error"),
        (err instanceof Error) ? err.message : t("common.unknownError")
      );
    } finally {
      setIsProcessing(false);
      setAiSuggestion(null); // Clear suggestion after action
      setAiError(null); // Clear any previous error
    }
  };

  const handleCancelSuggestion = (): void => {
    setSuggestionModalVisible(false);
    setAiSuggestion(null);
    setAiError(null);
  };

  const handleEditSuggestion = (
    field: keyof KanbanCardSuggestion,
    value: string
  ): void => {
    setAiSuggestion((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const handleStartRecording = async (): Promise<void> => {
    if (permissionResponse?.status !== "granted") {
      Alert.alert(
        t("voiceInput.permissionDeniedTitle"),
        t("voiceInput.permissionDeniedMessage")
      );
      return;
    }
    await startRecording();
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}
        onPress={isRecording ? void stopRecording : void handleStartRecording}
        disabled={isProcessing || suggestionModalVisible}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>
            {isRecording
              ? t("voiceInput.stopRecording")
              : t("voiceInput.startRecording")}
          </Text>
        )}
      </TouchableOpacity>
      {isRecording && (
        <Text style={[styles.recordingDuration, isRTL && styles.rtlText]}>
          {recordingDuration}s
        </Text>
      )}
      {isProcessing && (
        <Text style={[styles.processingText, isRTL && styles.rtlText]}>
          {t("voiceInput.processingAudio")}
        </Text>
      )}

      <AiSuggestionModal
        isVisible={suggestionModalVisible}
        suggestion={aiSuggestion}
        loading={isProcessing} // Use isProcessing for modal's loading state
        error={aiError}
        onConfirm={handleConfirmSuggestion}
        onCancel={handleCancelSuggestion}
        onEdit={handleEditSuggestion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIdle: {
    backgroundColor: "#007bff",
  },
  buttonRecording: {
    backgroundColor: "#dc3545", // Red for recording
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  recordingDuration: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  rtlText: {
    textAlign: "right",
  },
});
