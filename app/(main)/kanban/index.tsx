import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from "react-native";
import { useKanbanBoards } from "@/hooks/useKanbanBoards";
import { KanbanBoardListItem } from "@/components/kanban-board-list-item";
import { t, isRTL } from "@/i18n";
import { Stack } from "expo-router";

export default function KanbanBoardListScreen() {
  const { boards, loading, error, refetch } = useKanbanBoards();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("common.errorOccurred")}</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button title={t("common.tryAgain")} onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Stack.Screen options={{ title: t("kanban.boardListTitle") }} />
      {boards && boards.length > 0 ? (
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <KanbanBoardListItem board={item} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={[styles.noBoardsText, isRTL && styles.rtlText]}>
            {t("kanban.noBoardsFound")}
          </Text>
          {/* Add a button to create a new board later */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 10,
  },
  listContent: {
    paddingVertical: 8,
  },
  noBoardsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});
