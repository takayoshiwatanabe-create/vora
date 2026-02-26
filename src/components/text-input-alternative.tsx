import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { t, isRTL } from "@/i18n";

interface TextInputAlternativeProps {
  onCardCreated: (cardText: string) => void;
  boardId?: string; // Optional boardId for context
  loading: boolean; // Add loading prop
  disabled: boolean; // Add disabled prop
}

export function TextInputAlternative({
  onCardCreated,
  boardId,
  loading,
  disabled,
}: TextInputAlternativeProps): JSX.Element {
  const [textInput, setTextInput] = useState<string>("");

  const handleCreateCard = async (): Promise<void> => {
    if (textInput.trim() === "") {
      Alert.alert(t("voiceInput.errorTitle"), t("voiceInput.noTextFound"));
      return;
    }

    try {
      // In a real application, this would involve a call to your backend/Supabase
      // For now, we're just calling the onCardCreated callback.
      // The actual card creation logic (including AI processing if needed for text input)
      // should be handled by the parent component (VoiceInputButton or its parent)
      // to centralize AI logic and avoid duplication.
      console.log(
        `Text input card creation triggered with text: "${textInput}" for board: ${
          boardId ?? "default"
        }`
      );
      onCardCreated(textInput);
      setTextInput(""); // Clear input after successful creation request
    } catch (error: unknown) {
      Alert.alert(
        t("voiceInput.errorTitle"),
        t("voiceInput.processingError") + ": " + (error as Error).message
      );
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Input
        placeholder={t("voiceInput.textInputPlaceholder")}
        value={textInput}
        onChangeText={setTextInput}
        multiline
        numberOfLines={3}
        style={styles.textInput}
        accessibilityLabel={t("voiceInput.textInputPlaceholder")}
        accessibilityHint={t("voiceInput.textInputHint")}
        editable={!loading && !disabled} // Disable input when loading or explicitly disabled
      />
      <Button
        title={t("voiceInput.createCardButton")}
        onPress={handleCreateCard}
        loading={loading}
        disabled={disabled || textInput.trim() === ""} // Disable if parent is disabled or text is empty
        accessibilityLabel={t("voiceInput.createCardButton")}
        accessibilityHint={t("voiceInput.createCardButtonHint")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 20,
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  textInput: {
    marginBottom: 15,
    height: 100, // Fixed height for multiline input
    textAlignVertical: "top", // Align text to top for multiline
  },
});
