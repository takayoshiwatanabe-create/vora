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
import * as FileSystem from "expo-file-system";
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

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
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    // Request microphone permission on component mount
    void Audio.requestPermissionsAsync();
  }, []);

  const startRecording = async (): Promise<void> => {
    if (!session) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      return;
    }

    try {
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

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.startRecordingError")
      );
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    setIsRecording(false);
    setIsProcessing(true);

    if (!recording) {
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.stopRecordingError")
      );
      setIsProcessing(false);
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(undefined);

      if (!uri) {
        Alert.alert(
          t("voiceInput.errorTitle"),
          t("voiceInput.noTextFound")
        );
        setIsProcessing(false);
        return;
      }

      await processAudio(uri);
    } catch (err: unknown) {
      console.error("Failed to stop recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.stopRecordingError")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioUri: string): Promise<void> => {
    if (!session) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error("Audio file does not exist.");
      }

      const fileContent = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Call Supabase Edge Function for AI processing
      const { data, error } = await supabase.functions.invoke("process-voice", {
        body: {
          audioBase64: fileContent,
          boardId: boardId,
          userId: session.user.id,
        },
      });

      if (error) {
        console.error("Edge Function error:", error);
        Alert.alert(
          t("voiceInput.errorTitle"),
          t("api.ai.edgeFunctionError")
        );
        return;
      }

      const cardText = data?.cardText;
      if (cardText) {
        Alert.alert(
          t("voiceInput.successTitle"),
          t("voiceInput.successMessage", { text: cardText })
        );
        onCardCreated?.(cardText);
      } else {
        Alert.alert(
          t("voiceInput.errorTitle"),
          t("api.ai.noCardReturned")
        );
      }
    } catch (err: unknown) {
      console.error("Audio processing error:", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.processingError")
      );
    } finally {
      // Clean up the temporary audio file
      void FileSystem.deleteAsync(audioUri, { idempotent: true });
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}
        onPress={isRecording ? void stopRecording : void startRecording}
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
    marginTop: 20,
    marginBottom: 20,
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

