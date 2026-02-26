import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { t, isRTL } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { KanbanCardSuggestion, KanbanCard } from "@/types/kanban";
import { processAudioWithAI } from "@/api/ai";
import { AiSuggestionModal } from "./ai-suggestion-modal";
import { createKanbanCard } from "@/api/kanban";
import { addOfflineKanbanChange } from "@/lib/offlineManager";
import { useNetInfo } from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

interface VoiceInputButtonProps {
  boardId?: string; // Optional board ID for context
  onCardCreated: (cardText: string) => void; // Simplified to just cardText, actual card creation handled internally
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
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<KanbanCardSuggestion | null>(
    null
  );
  const [aiError, setAiError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);
  const netInfo = useNetInfo();
  const queryClient = useQueryClient(); // Initialize query client

  useEffect(() => {
    void Audio.requestPermissionsAsync();
  }, []);

  const startRecording = async (): Promise<void> => {
    try {
      if (isProcessing) return;

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          t("voiceInput.permissionDeniedTitle"),
          t("voiceInput.permissionDeniedMessage")
        );
        return;
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
      setIsProcessing(false);
      setAiError(null);
      setAiSuggestion(null);
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.startRecordingError"));
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (!recording) {
      return;
    }

    setIsRecording(false);
    setIsProcessing(true);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = recording.getURI();
      if (!uri) {
        Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.noTextFound"));
        setIsProcessing(false);
        setRecording(undefined);
        return;
      }

      const audioBlob = await (await fetch(uri)).blob();
      await processAudio(audioBlob);
    } catch (err: unknown) {
      console.error("Failed to stop recording", err);
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.stopRecordingError"));
    } finally {
      setRecording(undefined);
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioBlob: Blob): Promise<void> => {
    if (!session?.access_token) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      setIsProcessing(false);
      return;
    }

    try {
      setModalVisible(true);
      setAiError(null);
      setAiSuggestion(null);

      const result = await processAudioWithAI(audioBlob, boardId);

      if (result.suggestion) {
        setAiSuggestion(result.suggestion);
      } else {
        setAiError(result.message || t("api.ai.noCardReturned"));
      }
    } catch (err: unknown) {
      console.error("Error processing audio:", err);
      setAiError((err as Error).message || t("voiceInput.processingError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (confirmedSuggestion: KanbanCardSuggestion) => {
    if (!boardId || !session?.user?.id) {
      Alert.alert(t("common.error"), t("kanban.noBoardSelectedOrAuth"));
      setModalVisible(false);
      return;
    }

    setModalVisible(false);
    setIsProcessing(true);

    try {
      if (netInfo.isConnected) {
        const { data, error } = await createKanbanCard(
          confirmedSuggestion,
          boardId,
          session.user.id
        );

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          Alert.alert(
            t("voiceInput.successTitle"),
            t("voiceInput.successMessage", { text: data.title })
          );
          onCardCreated(data.title);
          void queryClient.invalidateQueries({ queryKey: ["kanbanCards", boardId] }); // Invalidate cards query
          void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", session.user.id] }); // Invalidate boards query to update card_count
        }
      } else {
        const tempCard: KanbanCard = {
          id: `temp-${Date.now()}`, // Temporary ID for offline card
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session.user.id,
          board_id: boardId,
          column_id: "temp-column", // Placeholder, will be resolved on sync
          title: confirmedSuggestion.cardText,
          description: confirmedSuggestion.project ? `Project: ${confirmedSuggestion.project}` : null,
          priority: confirmedSuggestion.priority || "medium",
          due_date: confirmedSuggestion.dueDate,
          order: 0,
        };
        addOfflineKanbanChange(boardId, "insert", tempCard);
        Alert.alert(
          t("voiceInput.offlineSuccessTitle"),
          t("voiceInput.offlineSuccessMessage", { text: confirmedSuggestion.cardText })
        );
        onCardCreated(confirmedSuggestion.cardText);
        // No need to invalidate queries for offline changes, offlineManager handles it on sync.
      }
    } catch (error: unknown) {
      console.error("Error creating Kanban card:", error);
      Alert.alert(
        t("voiceInput.errorTitle"),
        (error as Error).message || t("voiceInput.cardCreationError")
      );
    } finally {
      setIsProcessing(false);
      setAiSuggestion(null);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setAiSuggestion(null);
    setAiError(null);
  };

  const handleEditSuggestion = (
    field: keyof KanbanCardSuggestion,
    value: string
  ) => {
    if (aiSuggestion) {
      setAiSuggestion({ ...aiSuggestion, [field]: value });
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || modalVisible}
      >
        {isProcessing && !modalVisible ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>
            {isRecording
              ? t("voiceInput.stopRecording")
              : t("voiceInput.startRecording")}
          </Text>
        )}
      </TouchableOpacity>
      {isProcessing && !modalVisible && (
        <Text style={[styles.processingText, isRTL && styles.rtlText]}>
          {t("voiceInput.processingAudio")}
        </Text>
      )}

      <AiSuggestionModal
        isVisible={modalVisible}
        suggestion={aiSuggestion}
        loading={isProcessing && !aiSuggestion && !aiError}
        error={aiError}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onEdit={handleEditSuggestion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  button: {
    width: 180,
    height: 60,
    borderRadius: 30,
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
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  rtlText: {
    textAlign: "right",
  },
});
