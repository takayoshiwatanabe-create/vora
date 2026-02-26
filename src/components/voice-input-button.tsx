import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { t, isRTL, lang } from "@/i18n"; // Import `lang` for passing to AI
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { processAudioWithAI } from "@/api/ai"; // Import the new AI processing function
import { createKanbanCard } from "@/api/kanban"; // Import createKanbanCard
import { KanbanCardSuggestion } from "@/types/kanban"; // Import KanbanCardSuggestion
import { AiSuggestionModal } from "./ai-suggestion-modal"; // Import the modal

interface VoiceInputButtonProps {
  boardId?: string; // Optional boardId for context
  onCardCreated: (cardText: string) => void;
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
  const [aiSuggestion, setAiSuggestion] = useState<KanbanCardSuggestion | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | undefined>(undefined);
  const session = useAuthStore((state) => state.session);

  const startRecording = async (): Promise<void> => {
    if (!session) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("voiceInput.permissionDeniedTitle"),
          t("voiceInput.permissionDeniedMessage")
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // For web, we might need to adjust this or handle it differently
        // as web audio APIs behave differently than native.
        // For now, focusing on native.
        // @ts-expect-error - web property not available on native types
        web: {
          disableAudioContextClose: true,
        },
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
      setIsProcessing(false);
      setAiError(null);
      setAiSuggestion(null);
      setAiConfidence(0);
      setIsModalVisible(false);
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.startRecordingError")
      );
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (!recordingRef.current) {
      return;
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecording(undefined);
      recordingRef.current = undefined;

      if (!uri) {
        Alert.alert(
          t("voiceInput.errorTitle"),
          t("voiceInput.noTextFound")
        );
        setIsProcessing(false);
        return;
      }

      // Read the audio file as a Blob
      const audioFile = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const audioBlob = await (await fetch(`data:audio/webm;base64,${audioFile}`)).blob();

      // Process audio with AI
      const aiResponse = await processAudioWithAI(audioBlob, boardId);

      if (aiResponse.suggestion) {
        setAiSuggestion(aiResponse.suggestion);
        setAiConfidence(aiResponse.confidence);
        // "AI Confidence First" principle: AIが自信を持てる時のみ自動実行。不確かな時はユーザーへ確認
        // Assuming a confidence threshold for automatic execution, e.g., 0.8
        if (aiResponse.confidence >= 0.8) {
          // Auto-create card
          if (session?.user?.id && boardId) {
            const { data: newCard, error: createError } = await createKanbanCard(
              aiResponse.suggestion,
              boardId,
              session.user.id
            );
            if (createError) {
              setAiError(createError.message);
              Alert.alert(t("voiceInput.errorTitle"), createError.message);
            } else if (newCard) {
              Alert.alert(
                t("voiceInput.successTitle"),
                t("voiceInput.successMessage", { text: newCard.title })
              );
              onCardCreated(newCard.title);
            }
          } else {
            // If boardId or session is missing for auto-creation, still show modal
            setIsModalVisible(true);
          }
        } else {
          // Show modal for user confirmation/edit if confidence is low
          setIsModalVisible(true);
        }
      } else {
        setAiError(aiResponse.message || t("api.ai.noCardReturned"));
        Alert.alert(t("voiceInput.errorTitle"), aiResponse.message || t("api.ai.noCardReturned"));
      }
    } catch (err: unknown) {
      console.error("Failed to stop recording or process audio", err);
      setAiError((err as Error).message || t("voiceInput.processingError"));
      Alert.alert(
        t("voiceInput.errorTitle"),
        (err as Error).message || t("voiceInput.processingError")
      );
    } finally {
      setIsProcessing(false);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        // @ts-expect-error - web property not available on native types
        web: {
          disableAudioContextClose: false,
        },
      });
    }
  };

  const handlePress = (): void => {
    if (isProcessing) {
      return; // Prevent interaction while processing
    }
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const handleConfirmSuggestion = async (confirmedSuggestion: KanbanCardSuggestion): Promise<void> => {
    setIsModalVisible(false);
    if (!session?.user?.id || !boardId) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      return;
    }

    setIsProcessing(true);
    try {
      const { data: newCard, error: createError } = await createKanbanCard(
        confirmedSuggestion,
        boardId,
        session.user.id
      );
      if (createError) {
        Alert.alert(t("voiceInput.errorTitle"), createError.message);
      } else if (newCard) {
        Alert.alert(
          t("voiceInput.successTitle"),
          t("voiceInput.successMessage", { text: newCard.title })
        );
        onCardCreated(newCard.title);
      }
    } catch (err: unknown) {
      Alert.alert(
        t("voiceInput.errorTitle"),
        (err as Error).message || t("voiceInput.processingError")
      );
    } finally {
      setIsProcessing(false);
      setAiSuggestion(null); // Clear suggestion after processing
    }
  };

  const handleCancelSuggestion = (): void => {
    setIsModalVisible(false);
    setAiSuggestion(null); // Clear suggestion
    setAiError(null); // Clear any error
  };

  const handleEditSuggestion = (field: keyof KanbanCardSuggestion, value: string): void => {
    if (aiSuggestion) {
      setAiSuggestion({
        ...aiSuggestion,
        [field]: value,
      });
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
          isRecording && styles.buttonRecording,
          isProcessing && styles.buttonProcessing,
          isRTL && styles.rtlButton,
        ]}
        onPress={handlePress}
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
        isVisible={isModalVisible}
        suggestion={aiSuggestion}
        loading={isProcessing}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonRecording: {
    backgroundColor: "#dc3545", // Red when recording
  },
  buttonProcessing: {
    backgroundColor: "#ffc107", // Yellow/Orange when processing
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rtlButton: {
    // Specific RTL layout adjustments if needed
  },
  rtlText: {
    textAlign: "right",
  },
});
