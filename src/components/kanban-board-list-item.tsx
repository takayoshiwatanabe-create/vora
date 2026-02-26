import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { KanbanBoard } from "@/src/types/kanban";
import { t, isRTL, lang } from "@/i18n";
import { Link } from "expo-router";

interface KanbanBoardListItemProps {
  board: KanbanBoard;
}

export function KanbanBoardListItem({ board }: KanbanBoardListItemProps) {
  const formattedDate = new Date(board.created_at).toLocaleDateString(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <Link href={`/(main)/kanban/${board.id}`} asChild>
      <TouchableOpacity style={[styles.container, isRTL && styles.rtlContainer]}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{board.name}</Text>
          {board.description && (
            <Text style={[styles.description, isRTL && styles.rtlText]}>
              {board.description}
            </Text>
          )}
          <Text style={[styles.date, isRTL && styles.rtlText]}>
            {t("kanban.boardCreated", { date: formattedDate })}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  rtlText: {
    textAlign: "right",
  },
});
