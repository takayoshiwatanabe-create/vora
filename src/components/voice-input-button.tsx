import React, { useState, useEffect } from "react";
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
import { useVoiceRecording } from "@/src/hooks/useVoiceRecording";
import { createKanbanCard } from "@/src/api/ai"; // Assuming this API exists
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";

interface VoiceInputButtonProps {
  onCardCreated?: (cardText: string) => void;
  boardId?: string; // Optional boardId for creating cards in a specific board
}

export function VoiceInputButton({
  onCardCreated,
  boardId,
}: VoiceInputButtonProps): JSX.Element {
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    audioUri,
    clearRecording,
    permissionResponse,
    requestPermission,
  } = useVoiceRecording();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const session = useAuthStore((state) => state.session);
  const router = useRouter();

  useEffect(() => {
    if (!permissionResponse?.granted) {
      void requestPermission();
    }
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    // When audioUri is available after stopping recording, process it
    if (audioUri && !isProcessing) {
      void processAudio(audioUri);
    }
  }, [audioUri, isProcessing]); // Added isProcessing to dependencies

  const processAudio = async (uri: string): Promise<void> => {
    if (!session?.access_token) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      router.replace("/(auth)/sign-in");
      return;
    }

    setIsProcessing(true);
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to Edge Function for Whisper transcription and card creation
      const card = await createKanbanCard(
        base64Audio,
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
        Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.noTextFound"));
      }
    } catch (error: unknown) {
      console.error("Error processing audio:", error);
      Alert.alert(
        t("voiceInput.errorTitle"),
        (error as Error).message || t("voiceInput.processingError")
      );
    } finally {
      setIsProcessing(false);
      clearRecording(); // Clear the recording after processing
    }
  };

  const handlePress = async (): Promise<void> => {
    if (!permissionResponse?.granted) {
      const permission = await requestPermission();
      if (!permission?.granted) {
        Alert.alert(
          t("voiceInput.permissionDeniedTitle"),
          t("voiceInput.permissionDeniedMessage")
        );
        return;
      }
    }

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          isProcessing && styles.buttonProcessing,
        ]}
        onPress={handlePress}
        disabled={isProcessing}
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
        <Text style={[styles.durationText, isRTL && styles.rtlText]}>
          {formatDuration(recordingDuration)}
        </Text>
      )}
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
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonRecording: {
    backgroundColor: "#dc3545", // Red for recording
  },
  buttonProcessing: {
    backgroundColor: "#ffc107", // Yellow for processing
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  durationText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
  },
  rtlText: {
    textAlign: "right",
  },
});
