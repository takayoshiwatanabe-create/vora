import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { t, isRTL } from "@/i18n";
import { VoiceInputButton } from "@/components/voice-input-button"; // Import VoiceInputButton

export default function KanbanBoardDetailScreen(): JSX.Element {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();

  const handleCardCreated = (cardText: string): void => {
    console.log(`Card created in board ${boardId ?? "N/A"} with text:`, cardText);
    // Optionally refresh the board view or show a toast
  };

  return (
    <View style={[styles.container, isRTL ? styles.rtlContainer : null]}>
      <Stack.Screen options={{ title: t("kanban.boardDetailTitle") }} />
      <Text style={[styles.title, isRTL ? styles.rtlText : null]}>
        {t("kanban.boardIdDisplay", { id: boardId ?? "N/A" })}
      </Text>
      <Text style={[styles.subtitle, isRTL ? styles.rtlText : null]}>
        {t("kanban.boardDetailPlaceholder")}
      </Text>
      {/* Kanban board details and columns/cards will be rendered here */}
      {boardId && (
        <VoiceInputButton boardId={boardId} onCardCreated={handleCardCreated} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  rtlText: {
    textAlign: "right",
  },
});

