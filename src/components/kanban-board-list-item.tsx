import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { KanbanBoard } from "@/types/kanban";
import { t, isRTL, lang } from "@/i18n"; // Import lang for locale
import { Link } from "expo-router";

interface KanbanBoardListItemProps {
  board: KanbanBoard;
}

export function KanbanBoardListItem({ board }: KanbanBoardListItemProps) {
  // Use the `lang` variable from i18n/index.ts for toLocaleDateString
  const createdAt = new Date(board.created_at).toLocaleDateString(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/(main)/kanban/${board.id}`} asChild>
      <TouchableOpacity style={[styles.container, isRTL && styles.rtlContainer]}>
        <View style={styles.content}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{board.title}</Text>
          {board.description && (
            <Text style={[styles.description, isRTL && styles.rtlText]}>
              {board.description}
            </Text>
          )}
          <Text style={[styles.date, isRTL && styles.rtlText]}>
            {t("kanban.boardCreated", { date: createdAt })}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexDirection: "row", // For potential icon or additional elements
    alignItems: "center",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  rtlText: {
    textAlign: "right",
  },
});
