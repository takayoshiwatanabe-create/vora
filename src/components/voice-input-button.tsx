import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { t, isRTL } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { useVoiceRecording } from "@/src/hooks/useVoiceRecording"; // Use the custom hook
import { createKanbanCard } from "@/src/api/ai"; // Import the API function

interface VoiceInputButtonProps {
  boardId?: string; // Optional boardId for context
  onCardCreated?: (cardText: string) => void;
}

export function VoiceInputButton({
  boardId,
  onCardCreated,
}: VoiceInputButtonProps): JSX.Element {
  const {
    isRecording,
    audioUri,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecording(); // Destructure from the hook
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const session = useAuthStore((state) => state.session);

  const handleRecordingAction = async (): Promise<void> => {
    if (isRecording) {
      await stopRecording();
      // Audio processing will be triggered by the useEffect below when audioUri changes
    } else {
      clearRecording(); // Clear any previous recording before starting a new one
      await startRecording();
    }
  };

  // Effect to handle audioUri change after recording stops
  React.useEffect(() => {
    const processAudio = async (): Promise<void> => {
      if (audioUri) {
        setIsProcessing(true);
        try {
          const fileBase64 = await FileSystem.readAsStringAsync(audioUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (!session?.access_token) {
            Alert.alert(t("common.error"), t("auth.notAuthenticated"));
            return;
          }

          const card = await createKanbanCard(
            fileBase64,
            session.access_token,
            boardId
          );

          if (card) {
            Alert.alert(
              t("voiceInput.successTitle"),
              t("voiceInput.successMessage", { text: card.title })
            );
            onCardCreated?.(card.title);
          } else {
            Alert.alert(t("voiceInput.errorTitle"), t("api.ai.noCardReturned"));
          }
        } catch (err: unknown) {
          console.error("Failed to process audio:", err);
          Alert.alert(
            t("voiceInput.errorTitle"),
            (err as Error).message || t("voiceInput.processingError")
          );
        } finally {
          setIsProcessing(false);
          clearRecording(); // Clear the audioUri after processing
        }
      }
    };

    void processAudio();
  }, [audioUri, session, boardId, onCardCreated, clearRecording]);

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}
        onPress={handleRecordingAction}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isRecording
              ? t("voiceInput.stopRecording")
              : t("voiceInput.startRecording")}
          </Text>
        )}
      </TouchableOpacity>
      {isProcessing && (
        <Text style={[styles.processingText, isRTL && styles.rtlText]}>
          {t("voiceInput.processingAudio")}
        </Text>
      )}
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
    backgroundColor: "#dc3545",
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
