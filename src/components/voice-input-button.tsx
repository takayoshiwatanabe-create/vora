import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { processAudioWithAI } from "@/api/ai"; // Import the AI processing function
import { createKanbanCard } from "@/api/kanban"; // Import the Kanban card creation function
import { KanbanCardSuggestion } from "@/types/kanban";
import { AiSuggestionModal } from "./ai-suggestion-modal"; // Import the AI suggestion modal

interface VoiceInputButtonProps {
  boardId?: string; // Optional boardId for creating cards in a specific board
  onCardCreated?: (cardText: string) => void;
}

export function VoiceInputButton({
  boardId,
  onCardCreated,
}: VoiceInputButtonProps): JSX.Element {
  const [recording, setRecording] = useState<Audio.Recording | undefined>(
    undefined
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<KanbanCardSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  useEffect(() => {
    // Request microphone permissions on component mount
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
      if (!session) {
        Alert.alert(t("common.error"), t("auth.notAuthenticated"));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setAiError(null); // Clear previous errors
      setAiSuggestion(null); // Clear previous suggestion
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.startRecordingError"));
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    setIsRecording(false);
    setIsProcessing(true);
    try {
      if (!recording) {
        throw new Error("Recording object is undefined.");
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const uri = recording.getURI();
      setRecording(undefined);

      if (uri) {
        const audioBlob = await (await fetch(uri)).blob();
        await processAudio(audioBlob);
      } else {
        throw new Error("Recording URI is null.");
      }
    } catch (err: unknown) {
      console.error("Failed to stop recording", err);
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.stopRecordingError"));
      setAiError((err as Error).message || t("voiceInput.stopRecordingError"));
      setShowSuggestionModal(true); // Show modal with error
    } finally {
      setIsProcessing(false);
      // Clean up the temporary audio file
      // The URI is no longer needed after converting to blob and processing.
      // FileSystem.deleteAsync(uri) should be handled by useVoiceRecording hook if used,
      // but here we are directly managing recording, so we need to clean up.
      // However, fetch(uri).blob() might not create a local file that needs explicit deletion.
      // If it does, we need to ensure it's cleaned up. For now, assuming it's in-memory.
    }
  };

  const processAudio = async (audioBlob: Blob): Promise<void> => {
    if (!session || !userId) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      setIsProcessing(false);
      return;
    }

    try {
      const { suggestion, confidence, message } = await processAudioWithAI(audioBlob, boardId);

      if (suggestion && confidence >= 0.7) { // AI Confidence First: Only auto-suggest if confidence is high
        setAiSuggestion(suggestion);
        setShowSuggestionModal(true);
      } else if (suggestion && confidence < 0.7) { // Low confidence, show suggestion for user to confirm/edit
        setAiSuggestion(suggestion);
        setShowSuggestionModal(true);
        Alert.alert(t("aiSuggestion.lowConfidenceTitle"), t("aiSuggestion.lowConfidenceMessage"));
      } else { // No suggestion or very low confidence
        setAiError(message || t("api.ai.noCardReturned"));
        setShowSuggestionModal(true);
      }
    } catch (err: unknown) {
      console.error("Error processing audio:", err);
      setAiError((err as Error).message || t("voiceInput.processingError"));
      setShowSuggestionModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSuggestion = async (confirmedSuggestion: KanbanCardSuggestion): Promise<void> => {
    if (!userId || !boardId) {
      Alert.alert(t("common.error"), t("kanban.boardNotSelected")); // New translation key needed
      return;
    }

    setIsProcessing(true); // Show processing indicator while creating card
    setShowSuggestionModal(false); // Hide modal immediately

    try {
      const { data, error } = await createKanbanCard(confirmedSuggestion, boardId, userId);
      if (error) {
        throw error;
      }
      if (data) {
        Alert.alert(
          t("voiceInput.successTitle"),
          t("voiceInput.successMessage", { text: data.title })
        );
        onCardCreated?.(data.title);
      }
    } catch (err: unknown) {
      console.error("Error creating Kanban card:", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        (err as Error).message || t("kanban.createCardError") // New translation key needed
      );
    } finally {
      setIsProcessing(false);
      setAiSuggestion(null); // Clear suggestion after processing
      setAiError(null); // Clear error after processing
    }
  };

  const handleCancelSuggestion = (): void => {
    setShowSuggestionModal(false);
    setAiSuggestion(null);
    setAiError(null);
  };

  const handleEditSuggestion = (field: keyof KanbanCardSuggestion, value: string): void => {
    if (aiSuggestion) {
      setAiSuggestion((prev) => ({
        ...(prev as KanbanCardSuggestion),
        [field]: value,
      }));
    }
  };

  const buttonText = isRecording
    ? t("voiceInput.stopRecording")
    : isProcessing
    ? t("voiceInput.processingAudio")
    : t("voiceInput.startRecording");

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          isProcessing && styles.processingButton,
          isRTL && styles.rtlButton,
        ]}
        onPress={isRecording ? () => void stopRecording() : () => void startRecording()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.buttonText, isRTL && styles.rtlText]}>
            {buttonText}
          </Text>
        )}
      </TouchableOpacity>

      <AiSuggestionModal
        isVisible={showSuggestionModal}
        suggestion={aiSuggestion}
        loading={isProcessing} // Modal should show loading if processing, even if suggestion is null
        error={aiError}
        onConfirm={handleConfirmSuggestion}
        onCancel={handleCancelSuggestion}
        onEdit={handleEditSuggestion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: "#dc3545", // Red for recording
  },
  processingButton: {
    backgroundColor: "#ffc107", // Yellow for processing
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rtlButton: {
    // Adjustments for RTL if necessary
  },
  rtlText: {
    textAlign: "right",
  },
});

