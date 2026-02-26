import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { t, isRTL } from "@/i18n";

export default function KanbanBoardDetailScreen() {
  const { boardId } = useLocalSearchParams();

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Stack.Screen options={{ title: t("kanban.boardDetailTitle") }} />
      <Text style={[styles.title, isRTL && styles.rtlText]}>
        {t("kanban.boardIdDisplay", { id: boardId as string })}
      </Text>
      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
        {t("kanban.boardDetailPlaceholder")}
      </Text>
      {/* Kanban board details and columns/cards will be rendered here */}
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
