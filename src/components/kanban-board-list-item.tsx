import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router"; // Use Link from expo-router for navigation
import { KanbanBoard } from "@/types/kanban"; // Corrected import path
import { t, isRTL, lang } from "@/i18n"; // Import lang for locale

interface KanbanBoardListItemProps {
  board: KanbanBoard;
  // Removed onPress as Link handles navigation
}

export function KanbanBoardListItem({ board }: KanbanBoardListItemProps): JSX.Element {
  const formattedDate = new Date(board.created_at).toLocaleDateString(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/(main)/kanban/${board.id}`} asChild>
      <TouchableOpacity style={[styles.card, isRTL && styles.rtlCard]}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>{board.name}</Text>
        {board.description && (
          <Text style={[styles.description, isRTL && styles.rtlText]}>
            {board.description}
          </Text>
        )}
        <Text style={[styles.date, isRTL && styles.rtlText]}>
          {t("kanban.boardCreated", { date: formattedDate })}
        </Text>
        <Text style={[styles.cardCount, isRTL && styles.rtlText]}>
          {t("kanban.boardItemDescription", { count: board.card_count })}
        </Text>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
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
  rtlCard: {
    // Specific RTL layout adjustments if needed
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
    marginBottom: 5,
  },
  cardCount: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  rtlText: {
    textAlign: "right",
  },
});
