import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { t, isRTL } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface VoiceInputButtonProps {
  boardId?: string; // Optional boardId for creating cards in a specific board
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
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    // Request microphone permission on component mount
    void (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("voiceInput.permissionDeniedTitle"),
          t("voiceInput.permissionDeniedMessage")
        );
      }
    })();
  }, []);

  const startRecording = async (): Promise<void> => {
    if (!session) {
      Alert.alert(t("common.error"), t("auth.notAuthenticated"));
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // For Android, ensure recording is enabled
        // This might require more specific configuration depending on the use case
        // For simplicity, we'll rely on default behavior for now.
        // If issues arise, consider adding `android: { record: true }`
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.startRecordingError"));
      setIsRecording(false);
      setRecording(undefined);
    }
  };

  const stopRecording = async (): Promise<void> => {
    setIsRecording(false);
    setIsProcessing(true);

    if (!recording) {
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.stopRecordingError"));
      setIsProcessing(false);
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(undefined);

      if (!uri) {
        Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.noTextFound"));
        setIsProcessing(false);
        return;
      }

      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Call Supabase Edge Function to process audio
      const { data, error } = await supabase.functions.invoke<{
        cardText: string;
      }>("process-voice-input", {
        body: JSON.stringify({ audio: base64Audio, boardId }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (error) {
        console.error("Edge Function error:", error);
        Alert.alert(t("voiceInput.errorTitle"), t("api.ai.edgeFunctionError"));
      } else if (data?.cardText) {
        Alert.alert(
          t("voiceInput.successTitle"),
          t("voiceInput.successMessage", { text: data.cardText })
        );
        onCardCreated(data.cardText);
      } else {
        Alert.alert(t("voiceInput.errorTitle"), t("api.ai.noCardReturned"));
      }
    } catch (err: unknown) {
      console.error("Failed to stop recording or process audio", err);
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.processingError"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, isRTL ? styles.rtlContainer : null]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}
        onPress={isRecording ? () => void stopRecording() : () => void startRecording()}
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
      {isProcessing && (
        <Text style={[styles.processingText, isRTL ? styles.rtlText : null]}>
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

