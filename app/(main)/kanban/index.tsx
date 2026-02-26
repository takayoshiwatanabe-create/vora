import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from "react-native";
import { useKanbanBoards } from "@/src/hooks/useKanbanBoards";
import { KanbanBoardListItem } from "@/src/components/kanban-board-list-item";
import { t, isRTL } from "@/i18n";
import { Stack, useRouter } from "expo-router";
import { KanbanBoard } from "@/src/types/kanban";

export default function KanbanBoardsScreen(): JSX.Element {
  const { boards, loading, error, refetch } = useKanbanBoards();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={[styles.loadingText, isRTL && styles.rtlText]}>{t("kanban.loadingBoards")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, isRTL && styles.rtlText]}>{t("kanban.errorLoadingBoards")}: {error.message}</Text>
        <Button title={t("kanban.retryButton")} onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Stack.Screen options={{ title: t("kanban.boardsTitle") }} />
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t("kanban.boardsTitle")}</Text>
      {boards.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.noBoardsText, isRTL && styles.rtlText]}>{t("kanban.noBoardsFound")}</Text>
          {/* Add a button to create a new board later */}
        </View>
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(item: KanbanBoard) => item.id}
          renderItem={({ item }) => (
            <KanbanBoardListItem board={item} /> // onPress is handled by Link in KanbanBoardListItem
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  noBoardsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  rtlText: {
    textAlign: "right",
  },
});

