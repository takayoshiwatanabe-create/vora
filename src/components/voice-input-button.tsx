import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { TextInputAlternative } from "@/src/components/text-input-alternative";
import { processAudioWithAI } from "@/api/ai";
import { AiSuggestionModal } from "@/src/components/ai-suggestion-modal";
import { KanbanCardSuggestion } from "@/types/kanban";
import { createKanbanCard } from "@/api/kanban"; // Import createKanbanCard API

interface VoiceInputButtonProps {
  onCardCreated: (card: KanbanCardSuggestion) => void; // Changed to accept KanbanCardSuggestion
  boardId?: string; // Optional boardId for context
}

export function VoiceInputButton({
  onCardCreated,
  boardId,
}: VoiceInputButtonProps): JSX.Element {
  const [recording, setRecording] = useState<Audio.Recording | undefined>(
    undefined
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<KanbanCardSuggestion | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0); // Store AI confidence
  const [aiError, setAiError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    void requestMicrophonePermission();
  }, []);

  const requestMicrophonePermission = async (): Promise<void> => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("voiceInput.permissionDeniedTitle"),
        t("voiceInput.permissionDeniedMessage")
      );
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status !== "granted") {
        await requestMicrophonePermission();
        const { status: newStatus } = await Audio.getPermissionsAsync();
        if (newStatus !== "granted") {
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setShowTextInput(false);
      setAiSuggestion(null);
      setAiError(null);
      setAiConfidence(0);
      console.log("Recording started");
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.startRecordingError") + ": " + (err as Error).message
      );
      setIsRecording(false);
      setRecording(undefined);
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (!recording) {
      return;
    }

    setIsRecording(false);
    setIsProcessing(true);
    setAiError(null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(undefined);

      if (!uri) {
        Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.noAudioRecorded"));
        setIsProcessing(false);
        return;
      }

      console.log("Recording stopped, URI:", uri);
      await processAudio(uri);
    } catch (err: unknown) {
      console.error("Failed to stop recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.stopRecordingError") + ": " + (err as Error).message
      );
      setAiError(t("voiceInput.stopRecordingError") + ": " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioUri: string): Promise<void> => {
    if (!session?.access_token) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      setAiError(t("auth.notAuthenticated"));
      return;
    }

    try {
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();

      const aiResponse = await processAudioWithAI(audioBlob, boardId);

      setAiConfidence(aiResponse.confidence);

      if (aiResponse.suggestion) {
        setAiSuggestion(aiResponse.suggestion);
        // "AI Confidence First": AIが自信を持てる時のみ自動実行。不確かな時はユーザーへ確認
        // Assuming a threshold for "confidence". Let's say > 0.8 for auto-creation.
        // This threshold should ideally be configurable or come from the AI service.
        const CONFIDENCE_THRESHOLD = 0.8;
        if (aiResponse.confidence >= CONFIDENCE_THRESHOLD && boardId) {
          console.log("AI confidence high, auto-creating card.");
          await handleConfirmSuggestion(aiResponse.suggestion); // Auto-confirm
        } else {
          setIsModalVisible(true); // Show modal for user confirmation
        }
      } else {
        Alert.alert(t("voiceInput.infoTitle"), t("api.ai.noCardReturned"));
        setAiError(t("api.ai.noCardReturned"));
      }
    } catch (error: unknown) {
      console.error("Error processing audio:", error);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.processingError") + ": " + (error as Error).message
      );
      setAiError(t("voiceInput.processingError") + ": " + (error as Error).message);
    }
  };

  const handleConfirmSuggestion = async (confirmedSuggestion: KanbanCardSuggestion): Promise<void> => {
    if (!boardId) {
      Alert.alert(t("common.error"), t("kanban.noBoardSelected"));
      return;
    }
    try {
      // Map KanbanCardSuggestion to KanbanCard structure for DB insertion
      const newCard = {
        board_id: boardId,
        title: confirmedSuggestion.cardText,
        description: confirmedSuggestion.project ? `Project: ${confirmedSuggestion.project}` : undefined,
        status: "todo", // Default status
        priority: confirmedSuggestion.priority || null,
        due_date: confirmedSuggestion.dueDate ? new Date(confirmedSuggestion.dueDate).toISOString() : null,
      };
      const createdCard = await createKanbanCard(newCard);
      console.log("Confirmed suggestion and created card:", createdCard);
      onCardCreated(confirmedSuggestion); // Notify parent with the original suggestion
      setIsModalVisible(false);
      setAiSuggestion(null);
      Alert.alert(
        t("voiceInput.successTitle"),
        t("voiceInput.successMessage", { text: confirmedSuggestion.cardText })
      );
    } catch (error: unknown) {
      console.error("Error creating card from suggestion:", error);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.cardCreationError") + ": " + (error as Error).message
      );
    }
  };

  const handleEditSuggestion = (field: keyof KanbanCardSuggestion, value: string | null): void => {
    if (aiSuggestion) {
      setAiSuggestion({ ...aiSuggestion, [field]: value });
    }
  };

  const handleCancelSuggestion = (): void => {
    setIsModalVisible(false);
    setAiSuggestion(null);
    setAiError(t("aiSuggestion.cancelled"));
  };

  const handleTextInputCardCreated = async (cardText: string): Promise<void> => {
    if (!boardId) {
      Alert.alert(t("common.error"), t("kanban.noBoardSelected"));
      return;
    }
    try {
      setIsProcessing(true); // Indicate processing for text input
      const newCard = {
        board_id: boardId,
        title: cardText,
        description: null, // No description from simple text input
        status: "todo",
        priority: null,
        due_date: null,
      };
      const createdCard = await createKanbanCard(newCard);
      console.log("Created card from text input:", createdCard);
      onCardCreated({ cardText: createdCard.title, project: null, priority: null, dueDate: null }); // Notify parent
      Alert.alert(
        t("voiceInput.successTitle"),
        t("voiceInput.successMessage", { text: createdCard.title })
      );
    } catch (error: unknown) {
      console.error("Error creating card from text input:", error);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.cardCreationError") + ": " + (error as Error).message
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTextInput = (): void => {
    setShowTextInput(!showTextInput);
    if (isRecording) {
      void stopRecording();
    }
    setIsModalVisible(false);
    setAiSuggestion(null);
    setAiError(null);
    setAiConfidence(0);
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}
        onPress={isRecording ? () => void stopRecording() : () => void startRecording()}
        disabled={isProcessing || showTextInput} // Disable voice input if text input is shown
        accessibilityRole="button"
        accessibilityLabel={
          isRecording
            ? t("voiceInput.stopRecording")
            : t("voiceInput.startRecording")
        }
        accessibilityHint={
          isRecording
            ? t("voiceInput.stopRecordingHint")
            : t("voiceInput.startRecordingHint")
        }
        accessibilityState={{ disabled: isProcessing || showTextInput }}
      >
        {isProcessing && !showTextInput ? ( // Only show processing spinner for voice input
          <ActivityIndicator color="#fff" size="large" accessibilityLabel={t("voiceInput.processingAudio")} />
        ) : (
          <Text style={styles.buttonText}>
            {isRecording
              ? t("voiceInput.stopRecording")
              : t("voiceInput.startRecording")}
          </Text>
        )}
      </TouchableOpacity>

      {isProcessing && !showTextInput && ( // Only show processing text for voice input
        <Text style={[styles.processingText, isRTL && styles.rtlText]} accessibilityLiveRegion="polite">
          {t("voiceInput.processingAudio")}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.toggleButton, isRTL && styles.rtlToggleButton]}
        onPress={toggleTextInput}
        accessibilityRole="button"
        accessibilityLabel={
          showTextInput
            ? t("voiceInput.hideTextInput")
            : t("voiceInput.showTextInput")
        }
        accessibilityHint={
          showTextInput
            ? t("voiceInput.hideTextInputHint")
            : t("voiceInput.showTextInputHint")
        }
        disabled={isRecording || isProcessing} // Disable toggle if recording or processing voice
      >
        <Text style={styles.toggleButtonText}>
          {showTextInput
            ? t("voiceInput.hideTextInput")
            : t("voiceInput.showTextInput")}
        </Text>
      </TouchableOpacity>

      {showTextInput && (
        <TextInputAlternative
          onCardCreated={handleTextInputCardCreated}
          boardId={boardId}
          loading={isProcessing} // Pass processing state to text input
          disabled={isRecording} // Disable text input if voice recording is active
        />
      )}

      <AiSuggestionModal
        isVisible={isModalVisible}
        suggestion={aiSuggestion}
        loading={false} // Modal itself is not loading, it displays a suggestion or error
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
    marginTop: 20,
    width: "100%",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonIdle: {
    backgroundColor: "#007bff", // Primary blue
  },
  buttonRecording: {
    backgroundColor: "#dc3545", // Red for recording
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  processingText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  rtlText: {
    textAlign: "right",
  },
  toggleButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#6c757d", // Grey
  },
  rtlToggleButton: {
    // Specific RTL layout adjustments if needed
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
