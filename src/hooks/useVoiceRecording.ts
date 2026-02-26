import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import *as FileSystem from "expo-file-system";
import { PermissionResponse } from "expo-modules-core";
import { Alert } from "react-native";
import { t } from "@/i18n";

interface UseVoiceRecordingResult {
  isRecording: boolean;
  recordingDuration: number;
  audioUri: string | null;
  permissionResponse: PermissionResponse | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  requestPermission: () => Promise<PermissionResponse | null>;
}

export function useVoiceRecording(): UseVoiceRecordingResult {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [permissionResponse, requestPermission] =
    Audio.usePermissions() as [PermissionResponse | null, () => Promise<PermissionResponse | null>];

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearRecording = useCallback(() => {
    setAudioDuration(0); // Reset duration
    if (audioUri) {
      void FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(err =>
        console.warn("Failed to delete audio file:", err)
      );
    }
    setAudioUri(null);
  }, [audioUri]);

  const setAudioDuration = (duration: number) => {
    setRecordingDuration(duration);
  };

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      if (permissionResponse?.status !== "granted") {
        const permission = await requestPermission();
        if (permission?.status !== "granted") {
          // Alert is handled by the component using this hook.
          // This hook should ideally just return the status and let the component decide on UI.
          // For now, keeping the Alert here as it's a common pattern in Expo examples.
          Alert.alert(
            t("voiceInput.permissionDeniedTitle"),
            t("voiceInput.permissionDeniedMessage")
          );
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // For Android, you might want to specify `interruptionModeAndroid`
        // and `shouldDuckAndroid` based on your app's audio behavior.
        // For simplicity, we'll omit them for now.
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setAudioDuration(0);
      setAudioUri(null); // Clear previous URI

      intervalRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error("Failed to start recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        (err as Error).message || t("voiceInput.startRecordingError")
      );
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [permissionResponse, requestPermission]);

  const stopRecording = useCallback(async (): Promise<void> => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!recordingRef.current) {
      return;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) {
        setAudioUri(uri);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        // Reset Android audio mode if needed
      });
    } catch (err: unknown) {
      console.error("Failed to stop recording", err);
      Alert.alert(
        t("voiceInput.errorTitle"),
        (err as Error).message || t("voiceInput.stopRecordingError")
      );
    } finally {
      recordingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Ensure any lingering audio file is deleted on unmount
      if (audioUri) {
        void FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(err =>
          console.warn("Failed to delete audio file during unmount:", err)
        );
      }
    };
  }, [audioUri]); // Added audioUri to dependency array for cleanup

  return {
    isRecording,
    recordingDuration,
    audioUri,
    permissionResponse,
    startRecording,
    stopRecording,
    clearRecording,
    requestPermission,
  };
}
